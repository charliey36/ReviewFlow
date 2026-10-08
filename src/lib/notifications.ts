import { createAdminClient } from '@/lib/supabase/admin';
import { sendNotificationEmail, type NotificationKind } from '@/lib/email';

const FLAG = {
  welcome: 'welcome_email_sent_at',
  campaign: 'campaign_email_sent_at',
  trial_ending: 'trial_ending_email_sent_at',
} as const;

/**
 * Emails a business owner once per notification kind. The flag column is
 * claimed atomically (update ... where flag is null) so concurrent requests
 * or repeated cron runs can't double-send. Never throws.
 */
export async function notifyOwner(kind: NotificationKind, businessId: string) {
  try {
    const admin = createAdminClient();
    const col = FLAG[kind];
    const { data: business } = await admin
      .from('businesses')
      .update({ [col]: new Date().toISOString() } as never)
      .eq('id', businessId)
      .is(col, null)
      .select('owner_id, name')
      .maybeSingle();
    if (!business) return;

    const { data: owner } = await admin.auth.admin.getUserById(business.owner_id);
    if (owner?.user?.email) await sendNotificationEmail(owner.user.email, kind, business.name);
  } catch (err) {
    console.error(`notifyOwner(${kind}) failed`, err);
  }
}
