import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Visit } from '@/lib/database.types';

export type RebookingStatus = {
  lastVisit: Visit | null;
  nextExpectedVisitAt: Date | null;
  isDue: boolean;
  isLapsed: boolean;
};

/**
 * Computes a customer's expected next visit date from their most recent
 * visit and that visit's service recurrence interval. This is the
 * heuristic version of the spec's B4 "intelligent rebooking timing" —
 * using the service catalog's configured interval directly rather than a
 * learned per-customer average, which is explicitly scoped as a later
 * enhancement once enough visit history exists per customer.
 *
 * `isDue` = within 7 days of (or past) the expected date.
 * `isLapsed` = more than 2x the expected interval has passed with no new
 * visit — the same threshold used for win-back targeting (C3), so the two
 * features never disagree about who counts as lapsed.
 */
export function computeRebookingStatus(
  visits: Visit[],
  recurrenceIntervalDays: number | null
): RebookingStatus {
  if (visits.length === 0 || !recurrenceIntervalDays) {
    return { lastVisit: null, nextExpectedVisitAt: null, isDue: false, isLapsed: false };
  }

  const lastVisit = visits[0]; // callers pass visits sorted visited_at desc
  const lastVisitDate = new Date(lastVisit.visited_at);
  const nextExpectedVisitAt = new Date(
    lastVisitDate.getTime() + recurrenceIntervalDays * 24 * 60 * 60 * 1000
  );

  const now = Date.now();
  const dueWindowMs = 7 * 24 * 60 * 60 * 1000;
  const isDue = now >= nextExpectedVisitAt.getTime() - dueWindowMs;

  const lapsedThresholdMs = recurrenceIntervalDays * 2 * 24 * 60 * 60 * 1000;
  const isLapsed = now - lastVisitDate.getTime() > lapsedThresholdMs;

  return { lastVisit, nextExpectedVisitAt, isDue, isLapsed };
}

export function computeLifetimeValue(visits: Pick<Visit, 'price'>[]): number {
  return visits.reduce((sum, v) => sum + (v.price ?? 0), 0);
}

/**
 * Loads a customer's visits (most recent first) along with their most
 * recently used service's recurrence interval, for the rebooking status
 * calculation above.
 */
export async function getCustomerVisitsWithRebookingStatus(
  supabase: SupabaseClient<Database>,
  customerId: string
): Promise<{ visits: Visit[]; rebookingStatus: RebookingStatus; lifetimeValue: number }> {
  const { data: visits } = await supabase
    .from('visits')
    .select('*')
    .eq('customer_id', customerId)
    .order('visited_at', { ascending: false });

  const visitList = visits ?? [];
  const lifetimeValue = computeLifetimeValue(visitList);

  if (visitList.length === 0) {
    return {
      visits: [],
      rebookingStatus: { lastVisit: null, nextExpectedVisitAt: null, isDue: false, isLapsed: false },
      lifetimeValue,
    };
  }

  const lastServiceId = visitList[0].service_id;
  let recurrenceIntervalDays: number | null = null;

  if (lastServiceId) {
    const { data: service } = await supabase
      .from('services')
      .select('recurrence_interval_days')
      .eq('id', lastServiceId)
      .maybeSingle();
    recurrenceIntervalDays = service?.recurrence_interval_days ?? null;
  }

  return {
    visits: visitList,
    rebookingStatus: computeRebookingStatus(visitList, recurrenceIntervalDays),
    lifetimeValue,
  };
}
