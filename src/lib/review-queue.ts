import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { advanceJourneyEnrollment } from '@/lib/journeys';
import { renderMessage } from '@/lib/templates';
import { resolveChannel, sendMessage } from '@/lib/messaging';

/**
 * Sends one queued review request immediately, using the same compliant
 * template (public review link + private feedback option) as the scheduled
 * sender. On failure the message stays queued with the error recorded so the
 * owner can retry.
 */
export async function sendQueuedReview(
  supabase: SupabaseClient<Database>,
  businessId: string,
  messageId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: message } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .eq('business_id', businessId)
    .in('status', ['queued', 'pending'])
    .maybeSingle();
  if (!message) return { ok: false, error: 'This review request was already sent or cancelled.' };

  const [{ data: customer }, { data: business }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', message.customer_id).single(),
    supabase.from('businesses').select('*').eq('id', businessId).single(),
  ]);
  if (!customer || !business) return { ok: false, error: 'Customer not found.' };

  const channel = resolveChannel('email', customer);
  if (!channel) {
    await supabase.from('messages').update({ status: 'cancelled', last_error: 'Customer unsubscribed' }).eq('id', messageId);
    return { ok: false, error: `${customer.name} has unsubscribed.` };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const rendered = renderMessage('review_request', channel, {
      businessName: business.name,
      customerName: customer.name,
      publicReviewUrl: business.google_review_url ? `${appUrl}/api/track-message/${message.id}` : undefined,
      privateFeedbackUrl: `${appUrl}/feedback/${message.id}`,
      unsubscribeUrl: `${appUrl}/api/unsubscribe/${customer.id}`,
      rebookingUrl: `${appUrl}/book/${customer.id}`,
    });
    await sendMessage(
      {
        channel,
        to: { email: customer.email, phone: customer.phone ?? undefined },
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        listUnsubscribeUrl: `${appUrl}/api/unsubscribe/${customer.id}`,
      },
      `${business.name} via ReviewFlow`
    );
    await supabase
      .from('messages')
      .update({ status: 'sent', sent_at: new Date().toISOString(), channel, last_error: null })
      .eq('id', messageId);
    if (message.journey_enrollment_id) await advanceJourneyEnrollment(supabase, message.journey_enrollment_id);
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Send failed.';
    await supabase.from('messages').update({ last_error: error, attempts: message.attempts + 1 }).eq('id', messageId);
    return { ok: false, error };
  }
}
