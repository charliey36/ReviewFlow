import { NextResponse, type NextRequest } from 'next/server';
import { reviewUnavailableUrl } from '@/lib/review-destination';

export const dynamic = 'force-dynamic';

/** `/r` with no token (truncated / mangled link): a real 302 to the branded page, not a 404. */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(reviewUnavailableUrl(request.url, 'invalid-link'), 302);
}
