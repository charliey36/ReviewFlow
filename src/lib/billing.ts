import type { Business } from '@/lib/database.types';
import { APP_NAME } from '@/lib/brand';

/** The one and only Pentriq plan. Change the price here (and in Stripe) only. */
export const PLAN = {
  name: APP_NAME,
  priceMonthly: 29,
  currency: '£',
  perks: [
    'Unlimited customers and review requests',
    'Automatic email follow-up reminders',
    'Private feedback inbox',
    'Analytics and reporting',
  ],
};

export type BillingState = {
  status: 'trialing' | 'trial_expired' | 'active' | 'past_due' | 'canceled';
  trialDaysLeft: number;
  /** Whether sending/using the product is allowed. */
  hasAccess: boolean;
};

export function getBillingState(b: Business, now = new Date()): BillingState {
  // Columns come from migration 0005; fall back to a fresh 14-day trial if
  // it hasn't been applied yet so the app keeps working.
  const status = b.subscription_status ?? 'trialing';
  const trialEnd = b.trial_ends_at
    ? new Date(b.trial_ends_at).getTime()
    : new Date(b.created_at).getTime() + 14 * 86_400_000;
  const msLeft = trialEnd - now.getTime();
  const trialDaysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));
  if (status === 'trialing') {
    return msLeft > 0
      ? { status: 'trialing', trialDaysLeft, hasAccess: true }
      : { status: 'trial_expired', trialDaysLeft: 0, hasAccess: false };
  }
  return {
    status,
    trialDaysLeft,
    // past_due keeps access (Stripe retries); canceled does not.
    hasAccess: status === 'active' || status === 'past_due',
  };
}

/** True once STRIPE_SECRET_KEY and STRIPE_PRICE_ID are set. */
export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
