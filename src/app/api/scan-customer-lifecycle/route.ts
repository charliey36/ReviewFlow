import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enrollCustomerInJourney } from '@/lib/journeys';
import { computeRebookingStatus } from '@/lib/visits';

export const dynamic = 'force-dynamic';

/**
 * Daily scheduled job: scans every business's customers for (a) rebooking
 * reminders — due per their last visit's service recurrence interval — and
 * (b) win-back candidates — lapsed per the same threshold used on the
 * customer detail page (computeRebookingStatus's isLapsed) — and (c)
 * birthday matches, enrolling each into the corresponding journey.
 * enrollCustomerInJourney is itself idempotent (skips if already actively
 * enrolled), so running this daily is safe even if a customer stays
 * due/lapsed across multiple runs.
 */
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Server misconfigured: CRON_SECRET is not set.' }, { status: 500 });
  }

  const providedSecret =
    request.nextUrl.searchParams.get('secret') ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: businesses, error: businessesError } = await supabase.from('businesses').select('id');
  if (businessesError) {
    return NextResponse.json({ error: businessesError.message }, { status: 500 });
  }

  let rebookingEnrolled = 0;
  let winBackEnrolled = 0;
  let birthdayEnrolled = 0;

  const todayMonth = new Date().getUTCMonth();
  const todayDate = new Date().getUTCDate();

  for (const business of businesses ?? []) {
    const [{ data: journeys }, { data: customers }] = await Promise.all([
      supabase.from('journeys').select('*').eq('business_id', business.id).eq('is_active', true),
      supabase.from('customers').select('*').eq('business_id', business.id).is('unsubscribed_at', null),
    ]);

    const rebookingJourney = journeys?.find((j) => j.key === 'rebooking_reminder');
    const winBackJourney = journeys?.find((j) => j.key === 'win_back');
    const birthdayJourney = journeys?.find((j) => j.key === 'birthday');

    for (const customer of customers ?? []) {
      if (birthdayJourney && customer.date_of_birth) {
        const dob = new Date(customer.date_of_birth);
        if (dob.getUTCMonth() === todayMonth && dob.getUTCDate() === todayDate) {
          await enrollCustomerInJourney(supabase, birthdayJourney, customer.id);
          birthdayEnrolled += 1;
        }
      }

      if (!rebookingJourney && !winBackJourney) continue;

      const { data: visits } = await supabase
        .from('visits')
        .select('*')
        .eq('customer_id', customer.id)
        .order('visited_at', { ascending: false })
        .limit(1);

      if (!visits || visits.length === 0) continue;

      const { data: service } = visits[0].service_id
        ? await supabase.from('services').select('recurrence_interval_days').eq('id', visits[0].service_id).maybeSingle()
        : { data: null };

      const status = computeRebookingStatus(visits, service?.recurrence_interval_days ?? null);

      if (status.isLapsed && winBackJourney) {
        await enrollCustomerInJourney(supabase, winBackJourney, customer.id);
        winBackEnrolled += 1;
      } else if (status.isDue && rebookingJourney) {
        await enrollCustomerInJourney(supabase, rebookingJourney, customer.id);
        rebookingEnrolled += 1;
      }
    }
  }

  return NextResponse.json({ rebookingEnrolled, winBackEnrolled, birthdayEnrolled });
}
