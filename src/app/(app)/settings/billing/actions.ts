'use server';

import { requireBusiness } from '@/lib/business';
import { stripeConfigured } from '@/lib/billing';

export type BillingResult = { error?: string; success?: boolean };

/**
 * Starts the subscription. TODO(Stripe): create a Checkout Session (mode
 * 'subscription', price STRIPE_PRICE_ID, client_reference_id = business.id,
 * customer = business.stripe_customer_id) and redirect to session.url. A
 * webhook (checkout.session.completed, customer.subscription.updated/deleted)
 * should then write subscription_status, current_period_end and the stripe_* ids.
 */
export async function startSubscription(): Promise<BillingResult> {
  await requireBusiness();
  if (!stripeConfigured()) {
    return { error: 'Online payments are not switched on yet. Your free trial is unaffected.' };
  }
  return { error: 'Stripe Checkout is not implemented yet.' };
}

/** TODO(Stripe): create a Billing Portal session for stripe_customer_id and redirect to it. */
export async function openBillingPortal(): Promise<BillingResult> {
  const business = await requireBusiness();
  if (!business.stripe_customer_id) return { error: 'No active subscription to manage.' };
  return { error: 'Stripe Billing Portal is not implemented yet.' };
}
