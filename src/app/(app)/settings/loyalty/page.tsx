import { requireBusiness } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { LoyaltyProgramForm } from './loyalty-program-form';

export default async function LoyaltySettingsPage() {
  const business = await requireBusiness();
  const supabase = createClient();

  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('business_id', business.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Loyalty program</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Reward repeat visits, reviews, and referrals with points customers can redeem. Points are
        tracked on an append-only ledger per customer — visible on each customer&apos;s detail page.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card sm:p-8">
        <LoyaltyProgramForm program={program ?? null} />
      </div>
    </div>
  );
}
