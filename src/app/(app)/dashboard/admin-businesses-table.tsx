import { createAdminClient } from '@/lib/supabase/admin';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * All-businesses table shown on the dashboard for the admin account only
 * (see isAdminEmail in src/lib/business.ts). Uses the service-role client to
 * see every business, bypassing RLS, and the Supabase Admin API to resolve
 * each owner's email from their auth user id.
 */
export async function AdminBusinessesTable() {
  const supabase = createAdminClient();

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, owner_id, name, delay_hours, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load businesses: ${error.message}`);
  }

  // Look up each owner's email and customer count. Fine at prototype scale
  // (mirrors the simple per-row lookups already used in scripts/seed.mjs and
  // the send-review-requests job) — would want batching for real scale.
  const rows = await Promise.all(
    (businesses ?? []).map(async (business) => {
      const [{ data: userData }, { count: customerCount }] = await Promise.all([
        supabase.auth.admin.getUserById(business.owner_id),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business.id),
      ]);

      return {
        ...business,
        ownerEmail: userData?.user?.email ?? '(unknown)',
        customerCount: customerCount ?? 0,
      };
    })
  );

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          All registered businesses
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          admin only
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {rows.length} business{rows.length === 1 ? '' : 'es'} signed up.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/60">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Business
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Owner email
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Customers
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Delay
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Signed up
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {(row.name?.trim()?.[0] || '?').toUpperCase()}
                      </span>
                      {row.name || (
                        <span className="italic text-slate-400">Unnamed business</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{row.ownerEmail}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{row.customerCount}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{row.delay_hours}h</td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDateTime(row.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  No businesses registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
