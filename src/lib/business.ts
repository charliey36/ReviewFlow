import { cache } from 'react';
import { redirect } from 'next/navigation';
import { notifyOwner } from '@/lib/notifications';
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
/**
 * The signed-in user's id and email, verified from the session JWT.
 *
 * Uses getClaims(), which checks the token's signature locally against the
 * project's cached public keys instead of making a network round trip to the
 * Auth server (as getUser() does) — about 100ms saved per call. Memoised per
 * request so the layout, the page and requireBusiness() share one check.
 */
export const getAuthUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : null };
});

async function loadBusiness(): Promise<Business> {
  const supabase = createClient();
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }
  const userData = { user };

  // One round trip: the membership row plus its business via the foreign key
  // (previously two sequential queries). RLS applies to the embedded row too.
  const { data: membership, error: membershipError } = await supabase
    .from('business_members')
    .select('business_id, businesses(*)')
    .eq('user_id', user.id)
    .maybeSingle()
    .returns<{ business_id: string; businesses: Business | null } | null>();

  if (membershipError) {
  console.error('membershipError', membershipError);
  throw new Error(`Failed to load business: ${membershipError.message}`);
}

  if (membership?.businesses) {
    return membership.businesses;
  }

  if (membership) {
    // Embedded row unavailable (e.g. policy difference) — fall back to a direct lookup.
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', membership.business_id)
      .single();

    if (businessError || !business) {
  console.error('businessError', businessError);
  console.error('business', business);
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
  console.error('createError', createError);
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

  await notifyOwner('welcome', created.id);

  return created;
}

/**
 * Memoised per request: the layout and the page both call this, and without
 * the cache each call repeats three database round trips.
 */
export const requireBusiness = cache(loadBusiness);

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
