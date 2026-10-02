// Seed script for local/demo use. Creates a demo business (and its auth
// user, if missing) plus a handful of sample customers with review requests
// in a mix of states, so the dashboard looks populated immediately.
//
// Usage:
//   npm run seed
//
// Requires .env.local to contain NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY (see .env.example).

import { createClient } from '@supabase/supabase-js';

const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL || 'demo@reviewflow.app';
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'demo-password-123';
const DEMO_BUSINESS_NAME = 'The Daily Grind Cafe';
const DEMO_GOOGLE_REVIEW_URL = 'https://g.page/r/example-demo/review';

const SAMPLE_CUSTOMERS = [
  { name: 'Alice Johnson', email: 'alice.johnson@example.com', outcome: 'sent' },
  { name: 'Brian Smith', email: 'brian.smith@example.com', outcome: 'sent-clicked' },
  { name: 'Carla Nguyen', email: 'carla.nguyen@example.com', outcome: 'pending' },
  { name: 'David Lee', email: 'david.lee@example.com', outcome: 'pending' },
  { name: 'Emma Wilson', email: 'emma.wilson@example.com', outcome: 'sent' },
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error('Copy .env.example to .env.local and fill in your Supabase credentials.');
    process.exit(1);
  }
  return value;
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Looking for existing demo user (${DEMO_EMAIL})...`);

  let ownerId;
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existingUser = existingUsers.users.find((u) => u.email === DEMO_EMAIL);

  if (existingUser) {
    ownerId = existingUser.id;
    console.log(`Found existing demo user: ${ownerId}`);
  } else {
    console.log('Creating demo auth user...');
    const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (createUserError || !created.user) {
      throw new Error(`Failed to create demo user: ${createUserError?.message ?? 'unknown error'}`);
    }
    ownerId = created.user.id;
    console.log(`Created demo user: ${ownerId}`);
  }

  console.log('Upserting demo business...');
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .upsert(
      {
        owner_id: ownerId,
        name: DEMO_BUSINESS_NAME,
        google_review_url: DEMO_GOOGLE_REVIEW_URL,
        delay_hours: 2,
      },
      { onConflict: 'owner_id' }
    )
    .select('*')
    .single();

  if (businessError || !business) {
    throw new Error(`Failed to upsert business: ${businessError?.message ?? 'unknown error'}`);
  }
  console.log(`Business ready: ${business.name} (${business.id})`);

  console.log('Ensuring business_members row exists...');
  const { error: memberError } = await supabase
    .from('business_members')
    .upsert(
      { business_id: business.id, user_id: ownerId, role: 'owner' },
      { onConflict: 'business_id,user_id', ignoreDuplicates: true }
    );
  if (memberError) {
    throw new Error(`Failed to upsert business_members: ${memberError.message}`);
  }

  console.log('Seeding sample customers...');
  const now = Date.now();

  for (const sample of SAMPLE_CUSTOMERS) {
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', business.id)
      .eq('email', sample.email)
      .maybeSingle();

    if (existingCustomer) {
      console.log(`  - ${sample.name} already exists, skipping.`);
      continue;
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({ business_id: business.id, name: sample.name, email: sample.email })
      .select('*')
      .single();

    if (customerError || !customer) {
      throw new Error(`Failed to insert customer ${sample.name}: ${customerError?.message}`);
    }

    let reviewRequestPayload;
    if (sample.outcome === 'pending') {
      reviewRequestPayload = {
        business_id: business.id,
        customer_id: customer.id,
        status: 'pending',
        send_at: new Date(now + business.delay_hours * 60 * 60 * 1000).toISOString(),
      };
    } else {
      // Backdate send_at + sent_at so it shows as already sent.
      const sentAt = new Date(now - Math.random() * 3 * 24 * 60 * 60 * 1000);
      reviewRequestPayload = {
        business_id: business.id,
        customer_id: customer.id,
        status: 'sent',
        send_at: sentAt.toISOString(),
        sent_at: sentAt.toISOString(),
      };
    }

    const { data: reviewRequest, error: reviewRequestError } = await supabase
      .from('review_requests')
      .insert(reviewRequestPayload)
      .select('*')
      .single();

    if (reviewRequestError || !reviewRequest) {
      throw new Error(
        `Failed to insert review request for ${sample.name}: ${reviewRequestError?.message}`
      );
    }

    if (sample.outcome === 'sent-clicked') {
      const { error: clickError } = await supabase.from('click_events').insert({
        business_id: business.id,
        review_request_id: reviewRequest.id,
      });
      if (clickError) {
        throw new Error(`Failed to insert click event for ${sample.name}: ${clickError.message}`);
      }
    }

    console.log(`  - Added ${sample.name} (${sample.outcome})`);
  }

  console.log('');
  console.log('Seed complete.');
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
