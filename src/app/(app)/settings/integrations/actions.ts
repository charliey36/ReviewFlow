'use server';

import { revalidatePath } from 'next/cache';
import { requireBusiness } from '@/lib/business';
import { handleServiceCompleted } from '@/lib/service-import';
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

/** Sends a sample payload through the same pipeline the endpoint uses. */
export async function testImport(): Promise<{ message: string }> {
  const business = await requireBusiness();
  const { status, body } = await handleServiceCompleted(
    business.id,
    {
      customerName: 'Test Customer',
      email: 'test@reviewflow.local',
      phone: '07000000000',
      amountSpent: 100,
      serviceDate: new Date().toISOString().slice(0, 10),
    },
    'test'
  );
  revalidatePath('/settings/integrations');
  revalidatePath('/customers');
  const errs = (body as { errors?: string[] }).errors;
  return { message: status === 200 ? 'Test import sent. See Recent events below.' : `Test failed: ${errs?.join('; ')}` };
}
