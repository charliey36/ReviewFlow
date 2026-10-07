import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { computeRebookingRate, computeRevenueAttribution, computeHealthScore } from '@/lib/health';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { SectionCard } from '@/components/ui/section-card';
import { EmptyState } from '@/components/ui/empty-state';
import { CountUp } from '@/components/ui/count-up';

export const metadata: Metadata = { title: 'Analytics' };

// Order matters: it is the order of the stacked bar and the legend.
const tiers = [
  { key: 'thriving', label: 'Thriving', description: 'Frequent, recent, high spend', bar: 'bg-brand-500', dot: 'bg-brand-500' },
  { key: 'steady', label: 'Steady', description: 'Healthy, regular activity', bar: 'bg-sky-500', dot: 'bg-sky-500' },
  { key: 'at_risk', label: 'At risk', description: 'Slowing down \u2014 worth a nudge', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  { key: 'lapsed', label: 'Lapsed', description: 'No recent visits', bar: 'bg-red-500', dot: 'bg-red-500' },
] as const;

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

  const healthTotal = Object.values(healthTierCounts).reduce((sum, count) => sum + count, 0);
  const rate = rebookingRate.rate;

  return (
    <div>
      <PageHeader
        title="Analytics"
        icon="chart"
        tone="emerald"
        description="Rebooking rate, revenue influenced by automated messages, and customer health distribution."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <StatCard
          label="30-day rebooking rate"
          tone="sky"
          icon="refresh"
          value={
            rate === null ? (
              '\u2014'
            ) : (
              <CountUp value={rate} decimals={Number.isInteger(rate) ? 0 : 1} suffix="%" />
            )
          }
        >
          {rate === null ? (
            <p className="text-xs leading-5 text-ink-3">
              Not enough visit data yet. Log customer visits to see how many rebook within 30 days.
            </p>
          ) : (
            <>
              {/* Gauge with the 60-80% "healthy" benchmark band behind the fill. */}
              <div className="relative h-2.5 rounded-full bg-surface-muted">
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 border-x border-dashed border-sky-500/60 bg-sky-500/15"
                  style={{ left: '60%', width: '20%' }}
                />
                <div
                  className="bar-grow relative h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 shadow-[0_0_14px_rgb(14_165_233/0.45)]"
                  style={{ width: `${Math.max(2, Math.min(100, rate))}%` }}
                />
              </div>
              <div className="relative mt-1.5 h-4 text-2xs text-ink-4">
                <span className="absolute left-0">0%</span>
                <span className="absolute -translate-x-1/2" style={{ left: '70%' }}>
                  healthy 60&ndash;80%
                </span>
                <span className="absolute right-0">100%</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-3">
                {rebookingRate.rebookedWithin30Days} of {rebookingRate.completedVisits} visits led to a rebooking
                within 30 days.
              </p>
            </>
          )}
        </StatCard>

        <StatCard
          label="Revenue from rebooking reminders"
          tone="emerald"
          icon="chart"
          value={<CountUp value={revenueAttribution.totalAttributed} prefix="$" decimals={2} />}
          hint={`${revenueAttribution.attributedVisitCount} visit${
            revenueAttribution.attributedVisitCount === 1 ? '' : 's'
          } within 7 days of a reminder click. An estimate from click-to-visit timing, not perfect ground truth.`}
        />
      </div>

      <SectionCard
        className="mt-6"
        title="Customer health distribution"
        description="Based on recency, frequency and spend of visits (not click or review activity). Customers with no logged visits are excluded."
      >
        {healthTotal === 0 ? (
          <EmptyState
            icon="chart"
            title="No visit data yet"
            description="Once you log customer visits, you'll see how your customers split between thriving, steady, at-risk and lapsed."
            className="py-8"
          />
        ) : (
          <>
            <div
              className="flex h-3.5 overflow-hidden rounded-full bg-surface-muted"
              role="img"
              aria-label={tiers.map((tier) => `${tier.label}: ${healthTierCounts[tier.key]}`).join(', ')}
            >
              {tiers.map((tier) => {
                const count = healthTierCounts[tier.key];
                if (count === 0) return null;
                return (
                  <div
                    key={tier.key}
                    className={`bar-grow h-full border-r-2 border-surface last:border-r-0 ${tier.bar}`}
                    style={{ width: `${(count / healthTotal) * 100}%` }}
                  />
                );
              })}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
              {tiers.map((tier) => {
                const count = healthTierCounts[tier.key];
                return (
                  <div key={tier.key}>
                    <dt className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
                      <span className={`h-2 w-2 rounded-full ${tier.dot}`} aria-hidden="true" />
                      {tier.label}
                    </dt>
                    <dd className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold tracking-[-0.03em] text-ink tabular-nums">{count}</span>
                      <span className="text-xs text-ink-3 tabular-nums">
                        {Math.round((count / healthTotal) * 100)}%
                      </span>
                    </dd>
                    <p className="mt-1 text-xs leading-5 text-ink-3">{tier.description}</p>
                  </div>
                );
              })}
            </dl>
          </>
        )}
      </SectionCard>
    </div>
  );
}
