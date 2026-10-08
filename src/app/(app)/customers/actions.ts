'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/business';
import { parseServiceDate } from '@/lib/eligibility';

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

  const rawDate = String(formData.get('last_service_date') ?? '').trim();
  const serviceDate = rawDate ? parseServiceDate(rawDate) : null;
  if (rawDate && !serviceDate) return { error: 'Enter a valid last service date.' };

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({ business_id: business.id, name, email, phone: phone || null, last_service_date: serviceDate })
    .select('*')
    .single();

  if (customerError || !customer) {
    return { error: `Failed to add customer: ${customerError?.message ?? 'unknown error'}` };
  }

  revalidatePath('/customers');
  revalidatePath('/dashboard');
  return { success: true };
}
