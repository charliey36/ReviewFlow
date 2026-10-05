import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { computeRebookingRate, computeRevenueAttribution, computeHealthScore } from '@/lib/health';

const tierStyles: Record<string, string> = {
  thriving: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-900/50',
  steady: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/50',
  at_risk: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50',
  lapsed: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50',
};

export default async function AnalyticsPage() {
  const business = await requireBusiness();
  const supabase = createClient();

  const [{ data: visits }, { data: customers }, { data: services }] = await Promise.all([
    supabase.from('visits').select('*').eq('business_id', business.id),
    supabase.from('customers').select('id').eq('business_id', business.id),
    supabase.from('services').select('id, recurrence_interval_days').eq('business_id', business.id),
  ]);

  const rebookingRate = computeRebookingRate(visits ?? []);
  const revenueAttribution = await computeRevenueAttribution(supabase, business.id);

  const serviceIntervalById = new Map((services ?? []).map((s) => [s.id, s.recurrence_interval_days]));

  const healthTierCounts = { thriving: 0, steady: 0, at_risk: 0, lapsed: 0 };
  for (const customer of customers ?? []) {
    const customerVisits = (visits ?? []).filter((v) => v.customer_id === customer.id);
    if (customerVisits.length === 0) continue;
    const interval = serviceIntervalById.get(customerVisits[0].service_id ?? '') ?? null;
    const health = computeHealthScore(customerVisits, interval);
    healthTierCounts[health.tier] += 1;
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Rebooking rate, revenue influenced by automated messages, and customer health distribution.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">30-day rebooking rate</p>
          {rebookingRate.rate === null ? (
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">Not enough visit data yet.</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {rebookingRate.rate}%
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {rebookingRate.rebookedWithin30Days} of {rebookingRate.completedVisits} visits led to a rebooking
                within 30 days. Industry benchmark: 60\u201380% is considered healthy.
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue from rebooking reminders</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
            ${revenueAttribution.totalAttributed.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {revenueAttribution.attributedVisitCount} visit{revenueAttribution.attributedVisitCount === 1 ? '' : 's'}{' '}
            within 7 days of a rebooking reminder click. Estimate based on click-to-visit timing, not perfect
            ground truth.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Customer health distribution</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(healthTierCounts).map(([tier, count]) => (
            <span key={tier} className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${tierStyles[tier]}`}>
              {tier.replace('_', ' ')}: {count}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Based on recency, frequency, and spend of visits (not click/review activity). Customers with no logged
          visits are excluded.
        </p>
      </div>
    </div>
  );
}
