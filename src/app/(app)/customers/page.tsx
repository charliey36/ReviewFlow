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
  pending: 'bg-amber-50 text-amber-700',
  sent: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
};

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
      <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
      <p className="mt-1 text-sm text-slate-500">
        Add a customer to automatically schedule a review request email.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <AddCustomerForm />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Added
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
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
                  <tr key={customer.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateTime(customer.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
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
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                  No customers yet. Add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
