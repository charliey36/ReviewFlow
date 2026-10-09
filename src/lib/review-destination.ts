/**
 * Shared helpers for the public click-tracking endpoints
 * (/api/track-message/[id] and /api/track/[id]).
 *
 * The endpoints record the click, then HTTP-redirect to the business's Google
 * review URL. If that destination is missing/invalid, or the link itself is
 * unknown, they redirect to the branded /review-unavailable page instead of
 * returning a raw 404 or dumping the customer on the home page.
 */

export type UnavailableReason = 'not-configured' | 'invalid-link';

export const REVIEW_UNAVAILABLE_PATH = '/review-unavailable';

/** True only for absolute http(s) URLs. */
export function isValidReviewUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Absolute URL of the branded error page, relative to the incoming request. */
export function reviewUnavailableUrl(requestUrl: string, reason: UnavailableReason): URL {
  const url = new URL(REVIEW_UNAVAILABLE_PATH, requestUrl);
  url.searchParams.set('reason', reason);
  return url;
}
