'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/business';

export type AddCustomerResult = { error?: string; success?: boolean };

export async function addCustomer(
  _prev: AddCustomerResult,
  formData: FormData
): Promise<AddCustomerResult> {
  const business = await requireBusiness();
  const supabase = createClient();

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!name) {
    return { error: 'Customer name is required.' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { error: 'Enter a valid email address.' };
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({ business_id: business.id, name, email })
    .select('*')
    .single();

  if (customerError || !customer) {
    return { error: `Failed to add customer: ${customerError?.message ?? 'unknown error'}` };
  }

  // Schedule the review request send_at = now + business.delay_hours.
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

  revalidatePath('/customers');
  revalidatePath('/dashboard');
  return { success: true };
}
