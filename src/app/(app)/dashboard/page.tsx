import { isAdminEmail, requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { AdminBusinessesTable } from './admin-businesses-table';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const business = await requireBusiness();
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  const isAdmin = isAdminEmail(userData.user?.email);

  const [customersCount, emailsSentCount, clicksCount] = await Promise.all([
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id),
    supabase
      .from('review_requests')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('status', 'sent'),
    supabase
      .from('click_events')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id),
  ]);

  const hasReviewUrl = Boolean(business.google_review_url);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        A quick look at how {business.name} is doing with review requests.
      </p>

      {!hasReviewUrl && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add your Google review URL in{' '}
          <a href="/settings" className="font-medium underline">
            Settings
          </a>{' '}
          so review request emails link somewhere useful.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Customers added" value={customersCount.count ?? 0} />
        <StatCard label="Emails sent" value={emailsSentCount.count ?? 0} />
        <StatCard label="Review link clicks" value={clicksCount.count ?? 0} />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">How it works</h2>
        <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-slate-600">
          <li>Add a customer on the Customers page.</li>
          <li>
            A review request is scheduled to send {business.delay_hours} hour
            {business.delay_hours === 1 ? '' : 's'} later.
          </li>
          <li>The scheduled job sends the email once it&apos;s due.</li>
          <li>Clicking the button in the email is tracked here, then redirects to your Google review page.</li>
        </ol>
      </div>

      {isAdmin && <AdminBusinessesTable />}
    </div>
  );
}
