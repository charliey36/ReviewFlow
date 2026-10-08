import { NextResponse, type NextRequest } from 'next/server';
import { syncDemoCompany } from '@/lib/demo-sync';

export const dynamic = 'force-dynamic';

/** Periodic job (CRON_SECRET protected): pulls new rows from the demo company database. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.nextUrl.searchParams.get('secret') ?? request.headers.get('authorization')?.replace('Bearer ', '');
  if (!secret || provided !== secret) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    return NextResponse.json(await syncDemoCompany());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sync failed.' }, { status: 500 });
  }
}
