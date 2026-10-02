import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Business } from '@/lib/database.types';

/**
 * Gets the currently logged-in user's business row. Every authenticated page
 * needs this. Redirects to /login if there's no session, and lazily creates
 * the business row (plus its business_members owner row) if the user has
 * none yet (first login after signup).
 *
 * Access control for every other table is checked through business_members,
 * not businesses.owner_id directly — owner_id is kept as the ultimate
 * billing/ownership record, but a business could in principle have more
 * than one member in the future without any RLS rewrite.
 */
export async function requireBusiness(): Promise<Business> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect('/login');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Failed to load business: ${membershipError.message}`);
  }

  if (membership) {
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', membership.business_id)
      .single();

    if (businessError || !business) {
      throw new Error(`Failed to load business: ${businessError?.message ?? 'unknown error'}`);
    }

    return business;
  }

  // First time this user has hit an authenticated page — create their
  // business row with defaults, plus the business_members row that grants
  // them access to it. Next.js can render the (app) layout and the page
  // inside it concurrently, so two requests can both reach this point for
  // the same brand-new user at once. Use upsert with onConflict so the
  // losing request doesn't throw on the unique(owner_id) constraint — it
  // just gets back the row the other request created.
  const { data: created, error: createError } = await supabase
    .from('businesses')
    .upsert({ owner_id: userData.user.id }, { onConflict: 'owner_id', ignoreDuplicates: false })
    .select('*')
    .single();

  if (createError || !created) {
    throw new Error(
      `Failed to create business: ${createError?.message ?? 'unknown error'}`
    );
  }

  await supabase
    .from('business_members')
    .upsert(
      { business_id: created.id, user_id: userData.user.id, role: 'owner' },
      { onConflict: 'business_id,user_id', ignoreDuplicates: true }
    );

  return created;
}

/**
 * True if the given email is in the ADMIN_EMAIL list. Used to show the "all
 * businesses" table on the dashboard for app operators — not a separate
 * login, just a check against whichever email the user signed in with via
 * normal Supabase Auth. ADMIN_EMAIL supports multiple addresses separated
 * by commas, e.g. "owner@example.com,teammate@example.com".
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  const adminEmailsRaw = process.env.ADMIN_EMAIL;
  if (!adminEmailsRaw || !email) return false;

  const adminEmails = adminEmailsRaw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase());
}
