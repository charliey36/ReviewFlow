import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { getBillingState, PLAN } from '@/lib/billing';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { SettingsTabs } from '@/components/settings-tabs';
import { BillingButton } from './billing-button';
import { openBillingPortal, startSubscription, type BillingResult } from './actions';

export const metadata: Metadata = { title: 'Billing' };

const LABELS: Record<string, { text: string; tone: BadgeTone }> = {
  trialing: { text: 'Free trial', tone: 'info' },
  trial_expired: { text: 'Trial ended', tone: 'warning' },
  active: { text: 'Active', tone: 'success' },
  past_due: { text: 'Payment failed', tone: 'danger' },
  canceled: { text: 'Canceled', tone: 'neutral' },
};

export default async function BillingPage() {
  const business = await requireBusiness();
  const billing = getBillingState(business);
  const label = LABELS[billing.status] ?? LABELS.trialing;
  const subscribed = billing.status === 'active' || billing.status === 'past_due';

  return (
    <div>
      <PageHeader
        title="Billing"
        icon="cog"
        tone="slate"
        description="One simple plan. Cancel any time."
        tabs={<SettingsTabs />}
      />
      <div className="space-y-6">
        <SectionCard title="Your plan" action={<Badge tone={label.tone} dot>{label.text}</Badge>}>
          <p className="text-3xl font-semibold tracking-tight text-ink">
            {PLAN.currency}{PLAN.priceMonthly}
            <span className="text-base font-normal text-ink-3"> / month</span>
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-ink-2">
            {PLAN.perks.map((perk) => (
              <li key={perk}>✓ {perk}</li>
            ))}
          </ul>

          <p className="mt-5 text-sm text-ink-3">
            {billing.status === 'trialing' &&
              `${billing.trialDaysLeft} day${billing.trialDaysLeft === 1 ? '' : 's'} left in your free trial.`}
            {billing.status === 'trial_expired' && 'Subscribe to keep sending review requests.'}
            {billing.status === 'active' && business.current_period_end &&
              `Renews on ${new Date(business.current_period_end).toLocaleDateString('en-GB')}.`}
            {billing.status === 'past_due' && 'Your last payment failed. Update your card to avoid interruption.'}
            {billing.status === 'canceled' && 'Your subscription has ended. Resubscribe any time.'}
          </p>

          <div className="mt-5">
            {subscribed ? (
              <BillingButton action={openBillingPortal as (p: BillingResult, f: FormData) => Promise<BillingResult>} label="Manage billing" />
            ) : (
              <BillingButton action={startSubscription as (p: BillingResult, f: FormData) => Promise<BillingResult>} label={`Subscribe — ${PLAN.currency}${PLAN.priceMonthly}/month`} />
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
