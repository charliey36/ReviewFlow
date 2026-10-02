/**
 * Compliance invariants for review requests and feedback, enforced in code
 * — not just documented in a spec — because this is a legal-materiality
 * area (FTC Consumer Reviews and Testimonials Rule, 16 CFR Part 465,
 * effective Oct 2024; Google Maps user-generated-content policy).
 *
 * Both rules prohibit "review gating": asking only customers you expect to
 * leave a positive review, or routing dissatisfied customers away from the
 * public review platform. The compliant pattern this codebase implements is
 * "ask everyone publicly, offer everyone a private channel too" — never
 * conditional on predicted or collected sentiment.
 *
 * This module exists so that invariant has exactly one place it is checked,
 * rather than being re-derived (and potentially gotten wrong) in every
 * caller that builds a review-request message or landing page.
 */

export type ReviewRequestLinks = {
  publicReviewUrl: string | null;
  privateFeedbackUrl: string;
};

/**
 * Asserts that a set of links being sent to a customer includes an
 * unconditional private feedback option. Throws if it's missing — this is
 * intentionally a hard failure, not a warning, because silently shipping a
 * review request without the private-feedback option is exactly the kind
 * of regression this module exists to prevent.
 *
 * Does NOT require publicReviewUrl to be present, because a business that
 * hasn't configured a Google review URL yet shouldn't be blocked from
 * offering private feedback — but when it IS present, the caller must not
 * have derived its presence from any sentiment/rating signal. There is no
 * `customerSentiment` or `rating` parameter on this function or any
 * function that calls it in the send pipeline, by design: the compliance
 * property is partly enforced by that absence (nothing to branch on).
 */
export function assertCompliantReviewLinks(links: ReviewRequestLinks): void {
  if (!links.privateFeedbackUrl) {
    throw new Error(
      'Compliance violation: every review request must include a private feedback link, unconditionally, alongside the public review link.'
    );
  }
}
