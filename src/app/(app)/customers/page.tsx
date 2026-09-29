import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { AddCustomerForm } from './add-customer-form';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100',
  sent: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
  failed: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-100',
};

const avatarPalette = [
  'bg-brand-50 text-brand-700',
  'bg-sky-50 text-sky-700',
  'bg-violet-50 text-violet-700',
  'bg-amber-50 text-amber-700',
  'bg-rose-50 text-rose-700',
];

function avatarTone(seed: string) {
  const index = seed.charCodeAt(0) % avatarPalette.length;
  return avatarPalette[index];
}

export default async function CustomersPage() {
  const business = await requireBusiness();
  const supabase = createClient();

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, email, created_at, review_requests(status, send_at, sent_at)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load customers: ${error.message}`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Customers</h1>
        <span className="text-sm text-slate-400">
          {customers?.length ?? 0} total
        </span>
      </div>
      <p className="mt-1.5 text-sm text-slate-500">
        Add a customer to automatically schedule a review request email.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
            <svg
              className="h-4.5 w-4.5 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
          <h2 className="text-sm font-semibold text-slate-900">Add a customer</h2>
        </div>
        <AddCustomerForm />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/60">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Added
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Review request
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers && customers.length > 0 ? (
              customers.map((customer) => {
                const request = Array.isArray(customer.review_requests)
                  ? customer.review_requests[0]
                  : customer.review_requests;

                return (
                  <tr key={customer.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarTone(customer.name)}`}
                        >
                          {customer.name.trim()[0]?.toUpperCase() ?? '?'}
                        </span>
                        {customer.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{customer.email}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDateTime(customer.created_at)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {request ? (
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              statusStyles[request.status] ?? 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {request.status}
                          </span>
                          <span className="text-xs text-slate-500">
                            {request.status === 'sent' && request.sent_at
                              ? `Sent ${formatDateTime(request.sent_at)}`
                              : `Due ${formatDateTime(request.send_at)}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No request scheduled</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <svg
                        className="h-6 w-6 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                        />
                      </svg>
                    </span>
                    <p className="text-sm font-medium text-slate-600">No customers yet</p>
                    <p className="text-sm text-slate-400">Add your first one above.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
