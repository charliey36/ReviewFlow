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

  const windowDays = Math.round(Number(formData.get('review_request_window_days')));
  const rebookDays = Math.round(Number(formData.get('rebooking_reminder_interval_days')));
  if (!Number.isFinite(windowDays) || windowDays < 1 || !Number.isFinite(rebookDays) || rebookDays < 1) {
    return { error: 'Review window and rebooking interval must be at least 1 day.' };
  }

  if (!name) {
    return { error: 'Business name is required.' };
  }

  if (googleReviewUrl) {
    try {
      // eslint-disable-next-line no-new
      new URL(googleReviewUrl);
    } catch {
      return { error: 'Google review URL must be a valid URL (e.g. https://g.page/r/...).' };
    }
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
      review_request_window_days: windowDays,
      rebooking_reminder_interval_days: rebookDays,
    })
    .eq('id', business.id);

  if (error) {
    return { error: `Failed to save settings: ${error.message}` };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { success: true };
}

export type UploadLogoResult = { error?: string; success?: boolean; logoUrl?: string };

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/**
 * Uploads a new profile picture / logo for the business to the
 * `business-logos` Storage bucket (see
 * supabase/migrations/0004_business_logo_storage.sql) and saves the
 * resulting public URL on businesses.brand_logo_url. Storage object path is
 * "<business_id>/logo.<ext>" so re-uploading overwrites the previous file
 * instead of accumulating orphaned images, and so the storage RLS policies
 * can authorize access by checking the business_id folder segment against
 * business_members.
 */
export async function uploadBusinessLogo(
  _prev: UploadLogoResult,
  formData: FormData
): Promise<UploadLogoResult> {
  const business = await requireBusiness();
  const supabase = createClient();

  const file = formData.get('logo');

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an image to upload.' };
  }

  const extension = ALLOWED_LOGO_TYPES[file.type];
  if (!extension) {
    return { error: 'Image must be a PNG, JPEG, or WEBP file.' };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return { error: 'Image must be smaller than 2 MB.' };
  }

  const path = `${business.id}/logo.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('business-logos')
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return { error: `Failed to upload image: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('business-logos').getPublicUrl(path);

  // Cache-bust so the new image shows immediately even though the path is
  // the same as any previous upload.
  const logoUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('businesses')
    .update({ brand_logo_url: logoUrl })
    .eq('id', business.id);

  if (updateError) {
    return { error: `Failed to save image: ${updateError.message}` };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { success: true, logoUrl };
}
