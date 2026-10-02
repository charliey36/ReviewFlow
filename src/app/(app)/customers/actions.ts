'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/business';
import { enrollCustomerInJourney } from '@/lib/journeys';

export type AddCustomerResult = { error?: string; success?: boolean };

export async function addCustomer(
  _prev: AddCustomerResult,
  formData: FormData
): Promise<AddCustomerResult> {
  const business = await requireBusiness();
  const supabase = createClient();

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();

  if (!name) {
    return { error: 'Customer name is required.' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { error: 'Enter a valid email address.' };
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({ business_id: business.id, name, email, phone: phone || null })
    .select('*')
    .single();

  if (customerError || !customer) {
    return { error: `Failed to add customer: ${customerError?.message ?? 'unknown error'}` };
  }

  // Schedule the review request send_at = now + business.delay_hours
  // (legacy single-request row, kept so the existing dashboard counters and
  // cron endpoint continue to work unchanged).
  const sendAt = new Date(Date.now() + business.delay_hours * 60 * 60 * 1000);

  const { error: requestError } = await supabase.from('review_requests').insert({
    business_id: business.id,
    customer_id: customer.id,
    send_at: sendAt.toISOString(),
  });

  if (requestError) {
    return {
      error: `Customer added, but failed to schedule review request: ${requestError.message}`,
    };
  }

  // Also enroll in the multi-touch review_sequence journey (A2) — this is
  // what actually drives the reminder follow-ups; the legacy row above only
  // drives the original single-send dashboard counters.
  const { data: journey } = await supabase
    .from('journeys')
    .select('*')
    .eq('business_id', business.id)
    .eq('key', 'review_sequence')
    .eq('is_active', true)
    .maybeSingle();

  if (journey) {
    await enrollCustomerInJourney(supabase, journey, customer.id);
  }

  revalidatePath('/customers');
  revalidatePath('/dashboard');
  return { success: true };
}
