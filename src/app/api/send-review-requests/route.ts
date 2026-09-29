import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendReviewRequestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Scheduled job endpoint: finds all pending review_requests whose send_at
 * has passed, sends the email, and marks them sent (or failed).
 *
 * Protected by CRON_SECRET so it can't be triggered by random visitors —
 * pass it as either `?secret=...` or an `Authorization: Bearer ...` header.
 * Configure Vercel Cron (see vercel.json) or any external scheduler to hit
 * this on an interval (e.g. every 5 minutes).
 */
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'Server misconfigured: CRON_SECRET is not set.' },
      { status: 500 }
    );
  }

  const providedSecret =
    request.nextUrl.searchParams.get('secret') ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: dueRequests, error } = await supabase
    .from('review_requests')
    .select('id, business_id, customer_id, send_at')
    .eq('status', 'pending')
    .lte('send_at', nowIso)
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: `Failed to load due review requests: ${error.message}` },
      { status: 500 }
    );
  }

  if (!dueRequests || dueRequests.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: 'No due review requests.' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let sent = 0;
  let failed = 0;
  const results: Array<{ id: string; status: 'sent' | 'failed'; error?: string }> = [];

  for (const reviewRequest of dueRequests) {
    try {
      const [{ data: customer }, { data: business }] = await Promise.all([
        supabase
          .from('customers')
          .select('name, email')
          .eq('id', reviewRequest.customer_id)
          .single(),
        supabase
          .from('businesses')
          .select('name')
          .eq('id', reviewRequest.business_id)
          .single(),
      ]);

      if (!customer || !business) {
        throw new Error('Customer or business record not found.');
      }

      const trackingUrl = `${appUrl}/api/track/${reviewRequest.id}`;

      await sendReviewRequestEmail({
        to: customer.email,
        businessName: business.name,
        customerName: customer.name,
        trackingUrl,
      });

      await supabase
        .from('review_requests')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', reviewRequest.id);

      sent += 1;
      results.push({ id: reviewRequest.id, status: 'sent' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      await supabase
        .from('review_requests')
        .update({ status: 'failed' })
        .eq('id', reviewRequest.id);

      failed += 1;
      results.push({ id: reviewRequest.id, status: 'failed', error: message });
    }
  }

  return NextResponse.json({ sent, failed, results });
}
