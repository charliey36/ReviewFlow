'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/business';

export type LogVisitResult = { error?: string; success?: boolean };

export async function logVisit(
  customerId: string,
  _prev: LogVisitResult,
  formData: FormData
): Promise<LogVisitResult> {
  const business = await requireBusiness();
  const supabase = createClient();

  const serviceId = String(formData.get('service_id') ?? '').trim() || null;
  const priceRaw = String(formData.get('price') ?? '').trim();
  const price = priceRaw ? Number(priceRaw) : null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    return { error: 'Price must be a positive number.' };
  }

  const { error } = await supabase.from('visits').insert({
    business_id: business.id,
    customer_id: customerId,
    service_id: serviceId,
    price,
    notes,
  });

  if (error) {
    return { error: `Failed to log visit: ${error.message}` };
  }

  // Award loyalty points for the visit if the program is active.
  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .maybeSingle();

  if (program) {
    await supabase.from('loyalty_ledger_entries').insert({
      business_id: business.id,
      customer_id: customerId,
      delta: program.points_per_visit,
      reason: 'visit',
    });
  }

  revalidatePath(`/customers/${customerId}`);
  return { success: true };
}

export async function addCustomerTag(customerId: string, tag: string) {
  const business = await requireBusiness();
  const supabase = createClient();

  const cleaned = tag.trim().toLowerCase();
  if (!cleaned) return;

  await supabase
    .from('customer_tags')
    .insert({ business_id: business.id, customer_id: customerId, tag: cleaned })
    .select()
    .maybeSingle();

  revalidatePath(`/customers/${customerId}`);
}

export async function removeCustomerTag(tagId: string, customerId: string) {
  const business = await requireBusiness();
  const supabase = createClient();

  await supabase.from('customer_tags').delete().eq('id', tagId).eq('business_id', business.id);

  revalidatePath(`/customers/${customerId}`);
}
