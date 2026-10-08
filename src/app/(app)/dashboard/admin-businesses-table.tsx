import { createAdminClient } from '@/lib/supabase/admin';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DeleteOrganisationButton } from '../admin/organisations/delete-organisation-button';
import { EmptyState } from '@/components/ui/empty-state';

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
export async function AdminBusinessesTable({ currentBusinessId }: { currentBusinessId?: string } = {}) {
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
  // the send-review-requests job) - would want batching for real scale.
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
    <section className="card mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-ink">All registered businesses</h2>
          <Badge>Admin only</Badge>
        </div>
        <p className="text-[13px] text-ink-3">
          {rows.length} business{rows.length === 1 ? '' : 'es'} signed up
        </p>
      </div>

      <div className="scroll-thin overflow-x-auto">
        <table className="data-table data-table-hover">
          <thead>
            <tr>
              <th>Business</th>
              <th>Owner email</th>
              <th className="text-right">Customers</th>
              <th className="text-right">Delay</th>
              <th>Signed up</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name || '?'} />
                      {row.name ? (
                        <span className="font-medium text-ink">{row.name}</span>
                      ) : (
                        <span className="italic text-ink-4">Unnamed business</span>
                      )}
                    </div>
                  </td>
                  <td>{row.ownerEmail}</td>
                  <td className="text-right tabular-nums">{row.customerCount}</td>
                  <td className="text-right tabular-nums">{row.delay_hours}h</td>
                  <td className="whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                  <td className="text-right">
                    {row.id !== currentBusinessId && <DeleteOrganisationButton id={row.id} name={row.name} />}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon="users" title="No businesses registered yet" className="py-8" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
