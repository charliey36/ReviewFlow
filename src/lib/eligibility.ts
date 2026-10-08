import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const DAY_MS = 86_400_000;

/** Whole days between a YYYY-MM-DD service date and today (UTC). */
export function daysSinceService(lastServiceDate: string | null | undefined, now = new Date()): number | null {
  if (!lastServiceDate) return null;
  const t = Date.parse(`${lastServiceDate}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - t) / DAY_MS);
}

/** Eligible for a review request: serviced within the last `windowDays` days. */
export function isReviewEligible(lastServiceDate: string | null | undefined, windowDays: number): boolean {
  const days = daysSinceService(lastServiceDate);
  return days !== null && days >= 0 && days <= windowDays;
}

/** Eligible for a rebooking reminder: `intervalDays` or more days since service. */
export function isRebookingEligible(lastServiceDate: string | null | undefined, intervalDays: number): boolean {
  const days = daysSinceService(lastServiceDate);
  return days !== null && days >= intervalDays;
}

export const todayIso = () => new Date().toISOString().slice(0, 10);

/** Parses YYYY-MM-DD or DD/MM/YYYY into YYYY-MM-DD; null if invalid. */
export function parseServiceDate(raw: string): string | null {
  const v = raw.trim();
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
  const iso = m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : v;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso;
}

/**
 * Schedules the review request (legacy single send + review_sequence journey)
 * for a customer who has just received a service. Skips if one is already pending.
 */
export async function scheduleReviewRequest(
  supabase: SupabaseClient<Database>,
  businessId: string,
  delayHours: number,
  customerId: string
) {
  const { data: pending } = await supabase
    .from('review_requests')
    .select('id')
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .limit(1);
  if (pending && pending.length > 0) return;

  await supabase.from('review_requests').insert({
    business_id: businessId,
    customer_id: customerId,
    send_at: new Date(Date.now() + delayHours * 3_600_000).toISOString(),
  });

  const { data: journey } = await supabase
    .from('journeys')
    .select('*')
    .eq('business_id', businessId)
    .eq('key', 'review_sequence')
    .eq('is_active', true)
    .maybeSingle();
  if (journey) {
    const { enrollCustomerInJourney } = await import('@/lib/journeys');
    await enrollCustomerInJourney(supabase, journey, customerId);
  }
}
