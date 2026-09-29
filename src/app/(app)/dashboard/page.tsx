import { isAdminEmail, requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { AdminBusinessesTable } from './admin-businesses-table';

type StatTone = 'brand' | 'blue' | 'violet';

const toneStyles: Record<StatTone, { chip: string; icon: string }> = {
  brand: { chip: 'bg-brand-50', icon: 'text-brand-600' },
  blue: { chip: 'bg-sky-50', icon: 'text-sky-600' },
  violet: { chip: 'bg-violet-50', icon: 'text-violet-600' },
};

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: StatTone;
  icon: React.ReactNode;
}) {
  const styles = toneStyles[tone];
  return (
    <div className="group rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles.chip}`}>
          <svg
            className={`h-5 w-5 ${styles.icon}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden="true"
          >
            {icon}
          </svg>
        </span>
      </div>
      <p className="mt-4 text-4xl font-bold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

const steps = [
  {
    title: 'Add a customer',
    description: 'Add a customer on the Customers page.',
  },
  {
    title: 'Request scheduled',
    description: 'A review request is scheduled automatically after your chosen delay.',
  },
  {
    title: 'Email sent',
    description: 'The scheduled job sends the email once it\u2019s due.',
  },
  {
    title: 'Click tracked',
    description: 'Clicking the button in the email is tracked here, then redirects to your Google review page.',
  },
];

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
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          {business.name}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-slate-500">
        A quick look at how {business.name} is doing with review requests.
      </p>

      {!hasReviewUrl && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3.5 text-sm text-amber-900 shadow-sm">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-3.5 w-3.5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.25}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </span>
          <p className="pt-0.5">
            Add your Google review URL in{' '}
            <a href="/settings" className="font-medium underline underline-offset-2">
              Settings
            </a>{' '}
            so review request emails link somewhere useful.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Customers added"
          value={customersCount.count ?? 0}
          tone="brand"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
            />
          }
        />
        <StatCard
          label="Emails sent"
          value={emailsSentCount.count ?? 0}
          tone="blue"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          }
        />
        <StatCard
          label="Review link clicks"
          value={clicksCount.count ?? 0}
          tone="violet"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5"
            />
          }
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-slate-900">How it works</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {step.title === 'Request scheduled'
                    ? `Request scheduled (${business.delay_hours}h delay)`
                    : step.title}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && <AdminBusinessesTable />}
    </div>
  );
}
