'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/business';

export async function updateFeedbackStatus(feedbackId: string, status: 'acknowledged' | 'resolved') {
  const business = await requireBusiness();
  const supabase = createClient();

  await supabase
    .from('private_feedback')
    .update({ status })
    .eq('id', feedbackId)
    .eq('business_id', business.id);

  revalidatePath('/feedback-inbox');
}
