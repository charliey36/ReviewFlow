'use server';

import { revalidatePath } from 'next/cache';
import { requireBusiness } from '@/lib/business';
import { syncDemoCompany } from '@/lib/demo-sync';
import { generateApiKey } from '@/lib/api-keys';

/** Replaces the organisation's API key (the old one stops working immediately). */
export async function regenerateApiKey(): Promise<{ key?: string; error?: string }> {
  const business = await requireBusiness();
  try {
    return { key: await generateApiKey(business.id) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not regenerate key.' };
  }
}

/** Demo: pull new rows from the simulated company database right now. */
export async function syncDemoNow(): Promise<{ message: string }> {
  const business = await requireBusiness();
  try {
    const { imported, failed } = await syncDemoCompany(business.id);
    revalidatePath('/customers');
    return { message: `Imported ${imported} new record${imported === 1 ? '' : 's'}.${failed.length ? ` Failed: ${failed.join('; ')}` : ''}` };
  } catch (e) {
    return { message: e instanceof Error ? e.message : 'Sync failed.' };
  }
}
