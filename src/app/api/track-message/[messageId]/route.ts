import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exitJourneyEnrollment } from '@/lib/journeys';

export const dynamic = 'force-dynamic';

/**
 * Public click-tracking endpoint for the generalized `messages` table
 * (parallel to the original /api/track/[reviewRequestId], which continues
 * to serve the legacy review_requests flow unchanged). Records an
 * interaction_events row, exits the owning journey enrollment (so no more
 * reminder steps fire after a click), then redirects to the business's
 * Google review URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const { messageId } = params;
  const fallbackUrl = new URL('/', request.url);

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(messageId)) {
    return NextResponse.redirect(fallbackUrl);
  }

  const supabase = createAdminClient();

  const { data: message } = await supabase
    .from('messages')
    .select('id, business_id, customer_id, journey_enrollment_id')
    .eq('id', messageId)
    .maybeSingle();

  if (!message) {
    return NextResponse.redirect(fallbackUrl);
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('google_review_url')
    .eq('id', message.business_id)
    .maybeSingle();

  await supabase.from('interaction_events').insert({
    business_id: message.business_id,
    message_id: message.id,
    customer_id: message.customer_id,
    event_type: 'click',
  });

  if (message.journey_enrollment_id) {
    await exitJourneyEnrollment(supabase, message.journey_enrollment_id);
  }

  const destination = business?.google_review_url;
  const isValidDestination = typeof destination === 'string' && /^https?:\/\//i.test(destination);

  return NextResponse.redirect(isValidDestination ? destination : fallbackUrl);
}
