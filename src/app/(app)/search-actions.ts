'use server';

import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';

export type CustomerSearchResult = { id: string; name: string; email: string };

/**
 * Read-only lookup behind the command palette's "find a customer" results.
 * Scoped to the signed-in user's business (and by RLS), capped at 6 rows.
 */
export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  // Characters with meaning in PostgREST filters / LIKE patterns are dropped.
  const term = query.trim().slice(0, 60).replace(/[%_,()*\\]/g, ' ').trim();
  if (term.length < 2) return [];

  const business = await requireBusiness();
  const supabase = createClient();

  const { data } = await supabase
    .from('customers')
    .select('id, name, email')
    .eq('business_id', business.id)
    .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
    .order('name')
    .limit(6);

  return data ?? [];
}
