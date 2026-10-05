import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { getCustomerVisitsWithRebookingStatus } from '@/lib/visits';
import { LogVisitForm } from './log-visit-form';
import { TagEditor } from './tag-editor';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default async function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  const business = await requireBusiness();
  const supabase = createClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.customerId)
    .eq('business_id', business.id)
    .maybeSingle();

  if (!customer) notFound();

  const [{ data: services }, { data: tags }, { data: loyaltyProgram }, { data: ledgerEntries }, { visits, rebookingStatus, lifetimeValue }] =
    await Promise.all([
      supabase.from('services').select('*').eq('business_id', business.id).eq('is_active', true),
      supabase.from('customer_tags').select('*').eq('customer_id', customer.id),
      supabase.from('loyalty_programs').select('*').eq('business_id', business.id).maybeSingle(),
      supabase.from('loyalty_ledger_entries').select('delta').eq('customer_id', customer.id),
      getCustomerVisitsWithRebookingStatus(supabase, customer.id),
    ]);

  const servicesById = new Map((services ?? []).map((s) => [s.id, s]));
  const loyaltyBalance = (ledgerEntries ?? []).reduce((sum, e) => sum + e.delta, 0);

  return (
    <div>
      <Link href="/customers" className="text-sm font-medium text-brand-700 transition-all duration-200 hover:underline dark:text-brand-400">
        &larr; Back to customers
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{customer.name}</h1>
        {rebookingStatus.isLapsed && (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50">
            Lapsed
          </span>
        )}
        {!rebookingStatus.isLapsed && rebookingStatus.isDue && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50">
            Due for rebooking
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {customer.email} {customer.phone ? `· ${customer.phone}` : ''}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lifetime value</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
            ${lifetimeValue.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Next expected visit</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {rebookingStatus.nextExpectedVisitAt ? formatDate(rebookingStatus.nextExpectedVisitAt.toISOString()) : '\u2014'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loyalty points</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {loyaltyProgram?.is_active ? loyaltyBalance : '\u2014'}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tags</h2>
        <div className="mt-3">
          <TagEditor customerId={customer.id} tags={tags ?? []} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md dark:border-slate-700/70 dark:bg-surface-card">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Log a visit</h2>
        <div className="mt-4">
          <LogVisitForm customerId={customer.id} services={services ?? []} />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-md dark:border-slate-700/70 dark:bg-surface-card">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Visit history</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
          <thead className="bg-slate-50/60 dark:bg-slate-800/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Service</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {visits.length > 0 ? (
              visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDate(visit.visited_at)}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                    {visit.service_id ? servicesById.get(visit.service_id)?.name ?? 'Unknown service' : 'General visit'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {visit.price != null ? `$${visit.price.toFixed(2)}` : '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{visit.notes ?? '\u2014'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  No visits logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
