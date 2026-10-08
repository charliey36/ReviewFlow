import { createAdminClient } from '@/lib/supabase/admin';
import { importServiceVisit } from '@/lib/service-import';
import { isValidEmail } from '@/lib/customers';

/** Imports unsynced rows from the demo company database (optionally for one business). */
export async function syncDemoCompany(businessId?: string) {
  const db = createAdminClient();
  let q = db.from('demo_company_records').select('*').is('synced_at', null).order('created_at').limit(100);
  if (businessId) q = q.eq('business_id', businessId);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);

  let imported = 0;
  const failed: string[] = [];
  for (const r of rows ?? []) {
    const email = r.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      failed.push(`${r.customer_name}: invalid email`);
      continue;
    }
    try {
      await importServiceVisit(r.business_id, {
        name: r.customer_name.trim(),
        email,
        phone: (r.phone ?? '').trim(),
        amount: Number(r.amount_spent) || 0,
        serviceDate: r.service_date,
      });
      await db.from('demo_company_records').update({ synced_at: new Date().toISOString() }).eq('id', r.id);
      imported += 1;
    } catch (e) {
      failed.push(`${r.customer_name}: ${e instanceof Error ? e.message : 'error'}`);
    }
  }
  return { imported, failed };
}
