import type { Metadata } from 'next';
import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CopyButton } from '@/components/ui/copy-button';
import { CreateReferralForm } from './create-referral-form';
import { RedeemReferralForm } from './redeem-referral-form';

export const metadata: Metadata = { title: 'Referrals' };

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
      <PageHeader
        title="Referrals"
        icon="userPlus"
        tone="amber"
        description="Generate a referral code for an existing customer, then redeem it when a new customer they referred comes in. Both get rewarded with loyalty points (if your loyalty program is active) once the referral is marked complete."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Generate a referral code" description="Give an existing customer a code to share.">
          <CreateReferralForm customers={customers ?? []} />
        </SectionCard>

        <SectionCard title="Redeem a code" description="Match a code to the new customer it brought in.">
          <RedeemReferralForm customers={customers ?? []} />
        </SectionCard>
      </div>

      <SectionCard className="mt-6" title="All referrals" flush>
        {referrals && referrals.length > 0 ? (
          <div className="scroll-thin overflow-x-auto">
            <table className="data-table data-table-hover">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Referrer</th>
                  <th>Referee</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <code className="rounded-md bg-surface-muted px-2 py-1 font-mono text-[13px] font-medium tracking-wide text-ink ring-1 ring-inset ring-line-strong/60">
                          {referral.code}
                        </code>
                        <CopyButton value={referral.code} />
                      </div>
                    </td>
                    <td className="text-ink">{customerNameById.get(referral.referrer_customer_id) ?? '\u2014'}</td>
                    <td>
                      {referral.referee_customer_id
                        ? customerNameById.get(referral.referee_customer_id) ?? '\u2014'
                        : '\u2014'}
                    </td>
                    <td>
                      <Badge tone={referral.status === 'completed' ? 'success' : 'warning'} dot className="capitalize">
                        {referral.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="userPlus"
            title="No referrals yet"
            description="Generate a code for a happy customer and track who they bring in."
            className="py-10"
          />
        )}
      </SectionCard>
    </div>
  );
}
