import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exitJourneyEnrollment } from '@/lib/journeys';
import { isValidReviewUrl, reviewUnavailableUrl } from '@/lib/review-destination';

export const dynamic = 'force-dynamic';

/**
 * Public click-tracking endpoint for the generalized `messages` table
 * (parallel to the original /api/track/[reviewRequestId], which continues
 * to serve the legacy review_requests flow). Flow:
 *   1. load the message  2. load the business's Google review URL
 *   3. record an interaction_events click  4. exit the journey enrollment
 *      (so no more reminder steps fire)  5. HTTP 302 to the review URL.
 * If the link is unknown or the business has no valid review URL, the visitor
 * is sent to the branded /review-unavailable page rather than a raw 404.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const { messageId } = params;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(messageId)) {
    return NextResponse.redirect(reviewUnavailableUrl(request.url, 'invalid-link'));
  }

  const supabase = createAdminClient();

  const { data: message } = await supabase
    .from('messages')
    .select('id, business_id, customer_id, journey_enrollment_id')
    .eq('id', messageId)
    .maybeSingle();

  if (!message) {
    return NextResponse.redirect(reviewUnavailableUrl(request.url, 'invalid-link'));
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('google_review_url')
    .eq('id', message.business_id)
    .maybeSingle();

  // Record the click regardless — even if the business hasn't set a review
  // URL yet, we still want the click counted.
  await supabase.from('interaction_events').insert({
    business_id: message.business_id,
    message_id: message.id,
    customer_id: message.customer_id,
    event_type: 'click',
  });

  if (message.journey_enrollment_id) {
    await exitJourneyEnrollment(supabase, message.journey_enrollment_id);
  }

  const destination = business?.google_review_url?.trim();
  if (!isValidReviewUrl(destination)) {
    return NextResponse.redirect(reviewUnavailableUrl(request.url, 'not-configured'));
  }

  return NextResponse.redirect(destination, 302);
}
