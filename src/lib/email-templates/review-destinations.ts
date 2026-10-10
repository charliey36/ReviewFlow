/**
 * Where the "Leave a Review" button sends the customer.
 *
 * The review email template (./review-request.ts) knows nothing about Google,
 * Trustpilot, etc. — it receives a single `reviewLink` string. This module is
 * the seam for swapping destinations later:
 *
 *   - Today the send pipeline passes Pentriq's own click-tracking URL
 *     (/r/[token], or the legacy /api/track-message/[id] and /api/track/[id]), which records the click
 *     and then redirects to the business's Google review URL.
 *   - To support Trustpilot / Facebook / a Pentriq-hosted review page, add
 *     the platform here, store the destination URL per business, and have the
 *     tracking endpoint redirect to it. The email markup does not change.
 *
 * COMPLIANCE NOTE: the destination must never be chosen from a rating or
 * predicted sentiment (see src/lib/compliance.ts). Pick it from business
 * configuration only.
 */

import { APP_NAME } from '@/lib/brand';

export type ReviewPlatformId = 'pentriq' | 'google' | 'trustpilot' | 'facebook' | 'custom';

export const REVIEW_PLATFORMS: Record<ReviewPlatformId, { label: string }> = {
  pentriq: { label: APP_NAME },
  google: { label: 'Google Reviews' },
  trustpilot: { label: 'Trustpilot' },
  facebook: { label: 'Facebook Reviews' },
  custom: { label: 'the review page' },
};

/**
 * Stand-in used by the in-app preview only. It is never substituted
 * automatically when sending — a real send without a configured review link
 * omits the button rather than shipping a dead example.com URL to customers.
 */
export const PLACEHOLDER_REVIEW_URL = 'https://example.com/review';

/** Only plain http(s) URLs may be placed in an email href. */
export function isSafeHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export type ReviewDestination = {
  platform?: ReviewPlatformId;
  url?: string | null;
};

/**
 * Resolves a destination to the URL the CTA should use, or null if there is
 * no valid one. Pass `usePlaceholder` (preview only) to fall back to
 * PLACEHOLDER_REVIEW_URL.
 */
export function resolveReviewLink(
  destination: ReviewDestination | null | undefined,
  options: { usePlaceholder?: boolean } = {}
): string | null {
  if (isSafeHttpUrl(destination?.url)) return destination!.url!.trim();
  return options.usePlaceholder ? PLACEHOLDER_REVIEW_URL : null;
}
