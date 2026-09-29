'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/business';

export type SaveSettingsResult = { error?: string; success?: boolean };

export async function saveSettings(
  _prev: SaveSettingsResult,
  formData: FormData
): Promise<SaveSettingsResult> {
  const business = await requireBusiness();
  const supabase = createClient();

  const name = String(formData.get('name') ?? '').trim();
  const googleReviewUrl = String(formData.get('google_review_url') ?? '').trim();
  const delayHoursRaw = String(formData.get('delay_hours') ?? '').trim();
  const delayHours = Number(delayHoursRaw);

  if (!name) {
    return { error: 'Business name is required.' };
  }

  if (!googleReviewUrl) {
    return { error: 'Google review URL is required.' };
  }

  try {
    // eslint-disable-next-line no-new
    new URL(googleReviewUrl);
  } catch {
    return { error: 'Google review URL must be a valid URL (e.g. https://g.page/r/...).' };
  }

  if (!Number.isFinite(delayHours) || delayHours <= 0) {
    return { error: 'Delay must be a positive number of hours.' };
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      name,
      google_review_url: googleReviewUrl,
      delay_hours: delayHours,
    })
    .eq('id', business.id);

  if (error) {
    return { error: `Failed to save settings: ${error.message}` };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { success: true };
}
