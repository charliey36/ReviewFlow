import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidReviewUrl, reviewUnavailableUrl } from '@/lib/review-destination';

export const dynamic = 'force-dynamic';

/**
 * Public click-tracking endpoint linked from review request emails.
 * Records a click_event for the given review_request, then HTTP-redirects the
 * visitor to the business's real Google review URL. Runs with the admin
 * client since the visitor clicking this link has no Supabase auth session.
 * Unknown links or a missing review URL go to the branded
 * /review-unavailable page rather than a raw 404.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { reviewRequestId: string } }
) {
  const { reviewRequestId } = params;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(reviewRequestId)) {
    return NextResponse.redirect(reviewUnavailableUrl(request.url, 'invalid-link'));
  }

  const supabase = createAdminClient();

  const { data: reviewRequest } = await supabase
    .from('review_requests')
    .select('id, business_id')
    .eq('id', reviewRequestId)
    .maybeSingle();

  if (!reviewRequest) {
    return NextResponse.redirect(reviewUnavailableUrl(request.url, 'invalid-link'));
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('google_review_url')
    .eq('id', reviewRequest.business_id)
    .maybeSingle();

  // Record the click regardless — even if the business hasn't set a review
  // URL yet, we still want the click counted on the dashboard.
  await supabase.from('click_events').insert({
    business_id: reviewRequest.business_id,
    review_request_id: reviewRequest.id,
  });

  const destination = business?.google_review_url?.trim();
  if (!isValidReviewUrl(destination)) {
    return NextResponse.redirect(reviewUnavailableUrl(request.url, 'not-configured'));
  }

  return NextResponse.redirect(destination, 302);
}
