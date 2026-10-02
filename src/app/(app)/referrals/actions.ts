'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/business';

export type ReferralFormResult = { error?: string; success?: boolean; code?: string };

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createReferralCode(
  _prev: ReferralFormResult,
  formData: FormData
): Promise<ReferralFormResult> {
  const business = await requireBusiness();
  const supabase = createClient();

  const customerId = String(formData.get('customer_id') ?? '').trim();
  if (!customerId) return { error: 'Choose a customer.' };

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('business_id', business.id)
    .maybeSingle();

  if (!customer) return { error: 'Customer not found.' };

  let code = generateCode();
  let attempts = 0;

  // Retry on the (rare) chance of a collision with an existing code for
  // this business, given the unique(business_id, code) constraint.
  while (attempts < 5) {
    const { error } = await supabase.from('referrals').insert({
      business_id: business.id,
      referrer_customer_id: customerId,
      code,
    });

    if (!error) {
      revalidatePath('/referrals');
      return { success: true, code };
    }

    code = generateCode();
    attempts += 1;
  }

  return { error: 'Failed to generate a unique referral code, please try again.' };
}

export async function redeemReferralCode(code: string, refereeCustomerId: string) {
  const business = await requireBusiness();
  const supabase = createClient();

  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('business_id', business.id)
    .eq('code', code.toUpperCase())
    .eq('status', 'pending')
    .maybeSingle();

  if (!referral) return { error: 'Invalid or already-used referral code.' };

  if (referral.referrer_customer_id === refereeCustomerId) {
    return { error: 'A customer cannot refer themselves.' };
  }

  await supabase
    .from('referrals')
    .update({
      referee_customer_id: refereeCustomerId,
      status: 'completed',
      reward_granted_at: new Date().toISOString(),
    })
    .eq('id', referral.id);

  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('points_per_referral')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .maybeSingle();

  if (program) {
    await supabase.from('loyalty_ledger_entries').insert([
      {
        business_id: business.id,
        customer_id: referral.referrer_customer_id,
        delta: program.points_per_referral,
        reason: 'referral',
        reference_type: 'referral',
        reference_id: referral.id,
      },
      {
        business_id: business.id,
        customer_id: refereeCustomerId,
        delta: program.points_per_referral,
        reason: 'referral',
        reference_type: 'referral',
        reference_id: referral.id,
      },
    ]);
  }

  revalidatePath('/referrals');
  return { success: true };
}
