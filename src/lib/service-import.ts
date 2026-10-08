import { createAdminClient } from '@/lib/supabase/admin';
import { processServiceVisit } from '@/lib/review-automation';

export type ServiceImportInput = {
  name: string;
  email: string; // already trimmed + lowercased
  phone: string;
  amount: number;
  serviceDate: string; // YYYY-MM-DD, already validated
};

/**
 * Shared by the API endpoint and the demo company sync: finds/creates the
 * customer by email, records the visit (idempotent), updates stats, fires the hook.
 */
export async function importServiceVisit(businessId: string, input: ServiceImportInput) {
  const { name, email, phone, amount, serviceDate } = input;
  const db = createAdminClient();

  const { data: existing, error: lookupError } = await db
    .from('customers')
    .select('id, name, phone')
    .eq('business_id', businessId)
    .eq('email', email)
    .maybeSingle();
  if (lookupError) throw new Error(`Customer lookup failed: ${lookupError.message}`);

  let customerId: string;
  let customerCreated = false;

  if (existing) {
    customerId = existing.id;
    const update: { name?: string; phone?: string } = {};
    if (name !== existing.name) update.name = name;
    if (phone && phone !== existing.phone) update.phone = phone;
    if (Object.keys(update).length > 0) await db.from('customers').update(update).eq('id', customerId);
  } else {
    const { data: created, error } = await db
      .from('customers')
      .insert({ business_id: businessId, name, email, phone: phone || null })
      .select('id')
      .single();
    if (error || !created) throw new Error('Could not create customer.');
    customerId = created.id;
    customerCreated = true;
  }

  // Same customer + date + amount = same visit (safe for retries).
  const visitedAt = `${serviceDate}T12:00:00Z`;
  const { data: dup } = await db
    .from('visits')
    .select('id')
    .eq('customer_id', customerId)
    .eq('visited_at', visitedAt)
    .eq('price', amount)
    .limit(1);
  if (dup && dup.length > 0) return { customerId, visitId: dup[0].id, customerCreated, duplicate: true };

  const { data: visit, error: visitError } = await db
    .from('visits')
    .insert({ business_id: businessId, customer_id: customerId, visited_at: visitedAt, price: amount, notes: 'Imported' })
    .select('id')
    .single();
  if (visitError || !visit) throw new Error('Could not record service visit.');

  // Recalculate stats from the visits themselves so retries/races can't drift.
  const { data: all } = await db.from('visits').select('price, visited_at').eq('customer_id', customerId);
  const totalSpend = (all ?? []).reduce((sum, v) => sum + (v.price ?? 0), 0);
  const latest = (all ?? []).reduce((max, v) => (v.visited_at > max ? v.visited_at : max), visitedAt).slice(0, 10);
  const { error: statsError } = await db
    .from('customers')
    .update({ last_service_date: latest, total_spend: totalSpend, visit_count: all?.length ?? 1 })
    .eq('id', customerId);
  if (statsError) throw new Error(`Could not update customer statistics: ${statsError.message}`);

  await processServiceVisit({ businessId, customerId, visitId: visit.id, serviceDate });
  return { customerId, visitId: visit.id, customerCreated, duplicate: false };
}
