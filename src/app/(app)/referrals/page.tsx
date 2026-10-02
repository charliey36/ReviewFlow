import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { CreateReferralForm } from './create-referral-form';
import { RedeemReferralForm } from './redeem-referral-form';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100',
  completed: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
};

export default async function ReferralsPage() {
  const business = await requireBusiness();
  const supabase = createClient();

  const [{ data: customers }, { data: referrals }] = await Promise.all([
    supabase.from('customers').select('*').eq('business_id', business.id).order('name'),
    supabase
      .from('referrals')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false }),
  ]);

  const customerNameById = new Map((customers ?? []).map((c) => [c.id, c.name]));

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Referrals</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Generate a referral code for an existing customer, then redeem it when a new customer
        they referred comes in. Both get rewarded with loyalty points (if your loyalty program is
        active) once the referral is marked complete.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-slate-900">Generate a referral code</h2>
        <div className="mt-4">
          <CreateReferralForm customers={customers ?? []} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-slate-900">Redeem a code</h2>
        <div className="mt-4">
          <RedeemReferralForm customers={customers ?? []} />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Referrer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Referee</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {referrals && referrals.length > 0 ? (
              referrals.map((referral) => (
                <tr key={referral.id}>
                  <td className="px-4 py-3 text-sm font-mono text-slate-900">{referral.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {customerNameById.get(referral.referrer_customer_id) ?? '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {referral.referee_customer_id ? customerNameById.get(referral.referee_customer_id) ?? '\u2014' : '\u2014'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[referral.status]}`}>
                      {referral.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                  No referrals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
