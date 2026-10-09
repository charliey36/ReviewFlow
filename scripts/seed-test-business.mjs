// Seed script for a fully-populated TEST business — distinct from the
// `npm run seed` demo business. Simulates a salon that has been using
// Pentriq for ~6 months, with enough historical data to populate every
// section of the app: customers (active, lapsed, unsubscribed), services,
// visit history, review requests + clicks, private feedback, segments,
// loyalty program + ledger, referrals, and messages/journeys.
//
// Usage:
//   npm run seed:test
//
// Requires .env.local to contain NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY. Safe to re-run — upserts the business/user and
// skips customers that already exist by email.

import { createClient } from '@supabase/supabase-js';

const TEST_EMAIL = process.env.SEED_TEST_EMAIL || 'owner@test.com';
const TEST_PASSWORD = process.env.SEED_TEST_PASSWORD || 'test12345';
const TEST_BUSINESS_NAME = 'Test Salon';
const TEST_GOOGLE_REVIEW_URL = 'https://g.page/r/test-salon-demo/review';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (n) => new Date(now - n * DAY_MS);

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error('Copy .env.example to .env.local and fill in your Supabase credentials.');
    process.exit(1);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
const SERVICES = [
  { name: 'Haircut', recurrence_interval_days: 30, default_price: 45 },
  { name: 'Hair Colour', recurrence_interval_days: 60, default_price: 120 },
  { name: 'Manicure', recurrence_interval_days: 21, default_price: 35 },
  { name: 'Deep Conditioning Treatment', recurrence_interval_days: 45, default_price: 55 },
];

// ---------------------------------------------------------------------------
// Customers — a mix of lifecycle states so every page has something to show:
//   thriving   - frequent recent visits, high spend, reviewed, referred someone
//   steady     - regular but average recency/frequency
//   at_risk    - a few visits, below-average score
//   lapsed     - no visit in a long time (> 2x the service interval)
//   new        - just added, nothing happened yet (pending review request)
//   unsubscribed - opted out of emails
// ---------------------------------------------------------------------------
const CUSTOMERS = [
  { name: 'Olivia Bennett', email: 'olivia.bennett@example.com', phone: '+15550101', profile: 'thriving', tags: ['vip', 'colour-client'] },
  { name: 'Liam Carter', email: 'liam.carter@example.com', phone: '+15550102', profile: 'thriving', tags: ['vip'] },
  { name: 'Sophia Diaz', email: 'sophia.diaz@example.com', phone: '+15550103', profile: 'steady', tags: ['colour-client'] },
  { name: 'Noah Edwards', email: 'noah.edwards@example.com', phone: '+15550104', profile: 'steady', tags: [] },
  { name: 'Ava Foster', email: 'ava.foster@example.com', phone: '+15550105', profile: 'steady', tags: ['referral-source'] },
  { name: 'Mason Grant', email: 'mason.grant@example.com', phone: '+15550106', profile: 'at_risk', tags: [] },
  { name: 'Isabella Hughes', email: 'isabella.hughes@example.com', phone: '+15550107', profile: 'at_risk', tags: ['manicure'] },
  { name: 'Ethan Irwin', email: 'ethan.irwin@example.com', phone: '+15550108', profile: 'lapsed', tags: [] },
  { name: 'Mia Jenkins', email: 'mia.jenkins@example.com', phone: '+15550109', profile: 'lapsed', tags: ['colour-client'] },
  { name: 'Lucas Kelly', email: 'lucas.kelly@example.com', phone: '+15550110', profile: 'lapsed', tags: [] },
  { name: 'Charlotte Lane', email: 'charlotte.lane@example.com', phone: '+15550111', profile: 'new', tags: [] },
  { name: 'James Mitchell', email: 'james.mitchell@example.com', phone: '+15550112', profile: 'new', tags: [] },
  { name: 'Amelia Nash', email: 'amelia.nash@example.com', phone: '+15550113', profile: 'new', tags: [] },
  { name: 'Benjamin Ortiz', email: 'benjamin.ortiz@example.com', phone: '+15550114', profile: 'unsubscribed', tags: [] },
  { name: 'Harper Quinn', email: 'harper.quinn@example.com', phone: '+15550115', profile: 'steady', tags: ['manicure'] },
];

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- Auth user -----------------------------------------------------------
  console.log(`Looking for existing test user (${TEST_EMAIL})...`);
  let ownerId;
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw new Error(`Failed to list users: ${listError.message}`);

  const existingUser = existingUsers.users.find((u) => u.email === TEST_EMAIL);
  if (existingUser) {
    ownerId = existingUser.id;
    console.log(`Found existing test user: ${ownerId}`);
  } else {
    console.log('Creating test auth user...');
    const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (createUserError || !created.user) {
      throw new Error(`Failed to create test user: ${createUserError?.message ?? 'unknown error'}`);
    }
    ownerId = created.user.id;
    console.log(`Created test user: ${ownerId}`);
  }

  // --- Business --------------------------------------------------------------
  console.log('Upserting test business...');
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .upsert(
      {
        owner_id: ownerId,
        name: TEST_BUSINESS_NAME,
        google_review_url: TEST_GOOGLE_REVIEW_URL,
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

  await supabase
    .from('business_members')
    .upsert(
      { business_id: business.id, user_id: ownerId, role: 'owner' },
      { onConflict: 'business_id,user_id', ignoreDuplicates: true }
    );

  // --- Services ----------------------------------------------------------
  console.log('Seeding services...');
  const serviceByName = new Map();
  for (const svc of SERVICES) {
    const { data: existing } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .eq('name', svc.name)
      .maybeSingle();

    if (existing) {
      serviceByName.set(svc.name, existing);
      continue;
    }

    const { data: created, error } = await supabase
      .from('services')
      .insert({ business_id: business.id, ...svc })
      .select('*')
      .single();
    if (error || !created) throw new Error(`Failed to insert service ${svc.name}: ${error?.message}`);
    serviceByName.set(svc.name, created);
  }
  console.log(`  - ${serviceByName.size} services ready.`);

  // --- Loyalty program -----------------------------------------------------
  console.log('Setting up loyalty program...');
  const { data: loyaltyProgram, error: loyaltyError } = await supabase
    .from('loyalty_programs')
    .upsert(
      {
        business_id: business.id,
        is_active: true,
        points_per_visit: 10,
        points_per_referral: 50,
        points_per_review: 20,
        redemption_points: 100,
        redemption_reward_description: '$10 off your next visit',
      },
      { onConflict: 'business_id' }
    )
    .select('*')
    .single();
  if (loyaltyError || !loyaltyProgram) {
    throw new Error(`Failed to upsert loyalty program: ${loyaltyError?.message}`);
  }

  // --- Segments ------------------------------------------------------------
  console.log('Seeding segments...');
  const SEGMENTS = [
    {
      name: 'Lapsed high-value customers',
      rule_definition: [
        { field: 'days_since_last_visit', operator: 'gt', value: 60 },
        { field: 'lifetime_value', operator: 'gt', value: 100 },
      ],
    },
    {
      name: 'VIPs',
      rule_definition: [{ field: 'tag', operator: 'eq', value: 'vip' }],
    },
    {
      name: 'New customers',
      rule_definition: [{ field: 'visit_count', operator: 'eq', value: 0 }],
    },
  ];
  for (const segment of SEGMENTS) {
    const { data: existing } = await supabase
      .from('segments')
      .select('id')
      .eq('business_id', business.id)
      .eq('name', segment.name)
      .maybeSingle();
    if (existing) continue;

    const { error } = await supabase.from('segments').insert({ business_id: business.id, ...segment });
    if (error) throw new Error(`Failed to insert segment ${segment.name}: ${error.message}`);
  }
  console.log(`  - ${SEGMENTS.length} segments ready.`);

  // --- Customers + visits + review requests + feedback + loyalty ledger ---
  console.log('Seeding customers and their history...');

  const createdCustomers = [];

  for (const sample of CUSTOMERS) {
    let customer;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', business.id)
      .eq('email', sample.email)
      .maybeSingle();

    if (existingCustomer) {
      console.log(`  - ${sample.name} already exists, skipping creation (history may still be topped up).`);
      customer = existingCustomer;
    } else {
      const { data: created, error } = await supabase
        .from('customers')
        .insert({
          business_id: business.id,
          name: sample.name,
          email: sample.email,
          phone: sample.phone,
          source: 'manual',
          created_at: daysAgo(profileToSignupDaysAgo(sample.profile)).toISOString(),
          unsubscribed_at: sample.profile === 'unsubscribed' ? daysAgo(10).toISOString() : null,
        })
        .select('*')
        .single();
      if (error || !created) throw new Error(`Failed to insert customer ${sample.name}: ${error?.message}`);
      customer = created;
    }

    createdCustomers.push({ ...customer, profile: sample.profile, tags: sample.tags });

    // Tags
    for (const tag of sample.tags) {
      await supabase
        .from('customer_tags')
        .upsert(
          { business_id: business.id, customer_id: customer.id, tag },
          { onConflict: 'customer_id,tag', ignoreDuplicates: true }
        );
    }

    // Skip generating visit/message/review-request history more than once
    // per customer. Checking visits alone isn't sufficient because "new"
    // profile customers intentionally have zero visits — check
    // review_requests too, since every profile (including "new") gets one.
    const [{ count: existingVisitCount }, { count: existingReviewRequestCount }] = await Promise.all([
      supabase.from('visits').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
      supabase.from('review_requests').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
    ]);

    if (!existingVisitCount && !existingReviewRequestCount) {
      await seedCustomerHistory(supabase, business, customer, sample.profile, serviceByName, loyaltyProgram);
    }
  }

  // --- Referrals -----------------------------------------------------------
  console.log('Seeding referrals...');
  const referrer = createdCustomers.find((c) => c.tags?.includes('referral-source'));
  const referee = createdCustomers.find((c) => c.profile === 'new');
  if (referrer && referee) {
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('business_id', business.id)
      .eq('referrer_customer_id', referrer.id)
      .maybeSingle();

    if (!existingReferral) {
      const { error } = await supabase.from('referrals').insert({
        business_id: business.id,
        referrer_customer_id: referrer.id,
        referee_customer_id: referee.id,
        code: 'TESTSALON-REF01',
        status: 'completed',
        reward_granted_at: daysAgo(14).toISOString(),
        created_at: daysAgo(20).toISOString(),
      });
      if (error) throw new Error(`Failed to insert referral: ${error.message}`);

      await supabase.from('loyalty_ledger_entries').insert({
        business_id: business.id,
        customer_id: referrer.id,
        delta: loyaltyProgram.points_per_referral,
        reason: 'referral',
        created_at: daysAgo(14).toISOString(),
      });
    }

    // A second, still-pending referral for variety.
    const pendingReferrer = createdCustomers.find((c) => c.profile === 'thriving');
    if (pendingReferrer) {
      const { data: existingPending } = await supabase
        .from('referrals')
        .select('id')
        .eq('business_id', business.id)
        .eq('code', 'TESTSALON-REF02')
        .maybeSingle();
      if (!existingPending) {
        await supabase.from('referrals').insert({
          business_id: business.id,
          referrer_customer_id: pendingReferrer.id,
          code: 'TESTSALON-REF02',
          status: 'pending',
          created_at: daysAgo(3).toISOString(),
        });
      }
    }
  }

  console.log('');
  console.log('Seed complete.');
  console.log(`Test business: ${business.name}`);
  console.log(`Login: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
}

function profileToSignupDaysAgo(profile) {
  switch (profile) {
    case 'thriving':
      return 180;
    case 'steady':
      return 150;
    case 'at_risk':
      return 120;
    case 'lapsed':
      return 200;
    case 'unsubscribed':
      return 90;
    case 'new':
      return Math.floor(Math.random() * 3) + 1;
    default:
      return 60;
  }
}

/**
 * Generates visits, review requests, click events, messages/interaction
 * events, and loyalty ledger entries appropriate to a customer's lifecycle
 * profile, so every section of the app (dashboard, analytics, customers,
 * feedback inbox, loyalty) has realistic data to show.
 */
async function seedCustomerHistory(supabase, business, customer, profile, serviceByName, loyaltyProgram) {
  const haircut = serviceByName.get('Haircut');
  const colour = serviceByName.get('Hair Colour');
  const manicure = serviceByName.get('Manicure');

  const visitPlans = {
    // [daysAgo, service, price, notes]
    thriving: [
      [175, haircut, 45, 'First visit, loved the salon'],
      [140, colour, 120, null],
      [110, haircut, 45, null],
      [80, manicure, 35, null],
      [50, haircut, 48, 'Asked for a slightly shorter cut'],
      [20, colour, 125, 'Switched to balayage'],
    ],
    steady: [
      [145, haircut, 45, null],
      [95, haircut, 45, null],
      [45, haircut, 45, null],
      [10, manicure, 35, null],
    ],
    at_risk: [
      [115, haircut, 45, null],
      [75, haircut, 45, 'Mentioned moving across town soon'],
    ],
    lapsed: [
      [195, colour, 120, null],
      [160, haircut, 45, null],
    ],
    unsubscribed: [
      [85, haircut, 45, null],
      [55, haircut, 45, null],
    ],
    new: [],
  };

  const plan = visitPlans[profile] ?? [];
  for (const [daysBack, service, price, notes] of plan) {
    const { error } = await supabase.from('visits').insert({
      business_id: business.id,
      customer_id: customer.id,
      service_id: service?.id ?? null,
      visited_at: daysAgo(daysBack).toISOString(),
      price,
      notes,
    });
    if (error) throw new Error(`Failed to insert visit for ${customer.name}: ${error.message}`);

    if (loyaltyProgram?.is_active) {
      await supabase.from('loyalty_ledger_entries').insert({
        business_id: business.id,
        customer_id: customer.id,
        delta: loyaltyProgram.points_per_visit,
        reason: 'visit',
        created_at: daysAgo(daysBack).toISOString(),
      });
    }
  }

  // Review requests (legacy table, still used by the Customers page) +
  // click events, matching the profile's engagement level.
  const reviewRequestPlans = {
    thriving: { daysAgo: 18, status: 'sent', clicked: true, feedback: { rating: 5, comment: 'Olivia always makes me feel amazing. Best salon in town!' } },
    steady: { daysAgo: 8, status: 'sent', clicked: true, feedback: null },
    at_risk: { daysAgo: 72, status: 'sent', clicked: false, feedback: { rating: 3, comment: 'Service was fine but I waited 20 minutes past my appointment time.' } },
    lapsed: { daysAgo: 158, status: 'sent', clicked: false, feedback: null },
    unsubscribed: { daysAgo: 53, status: 'sent', clicked: false, feedback: null },
    new: { status: 'pending' },
  };

  const rrPlan = reviewRequestPlans[profile];
  if (rrPlan) {
    const sendAt = rrPlan.status === 'pending' ? new Date(now + business.delay_hours * 60 * 60 * 1000) : daysAgo(rrPlan.daysAgo);
    const payload =
      rrPlan.status === 'pending'
        ? { business_id: business.id, customer_id: customer.id, status: 'pending', send_at: sendAt.toISOString() }
        : {
            business_id: business.id,
            customer_id: customer.id,
            status: 'sent',
            send_at: sendAt.toISOString(),
            sent_at: sendAt.toISOString(),
          };

    const { data: reviewRequest, error } = await supabase
      .from('review_requests')
      .insert(payload)
      .select('*')
      .single();
    if (error || !reviewRequest) throw new Error(`Failed to insert review request for ${customer.name}: ${error?.message}`);

    if (rrPlan.clicked) {
      const { error: clickError } = await supabase.from('click_events').insert({
        business_id: business.id,
        review_request_id: reviewRequest.id,
        clicked_at: daysAgo(rrPlan.daysAgo - 1).toISOString(),
      });
      if (clickError) throw new Error(`Failed to insert click event for ${customer.name}: ${clickError.message}`);

      if (loyaltyProgram?.is_active) {
        await supabase.from('loyalty_ledger_entries').insert({
          business_id: business.id,
          customer_id: customer.id,
          delta: loyaltyProgram.points_per_review,
          reason: 'review',
          created_at: daysAgo(rrPlan.daysAgo - 1).toISOString(),
        });
      }
    }

    if (rrPlan.feedback) {
      const { error: feedbackError } = await supabase.from('private_feedback').insert({
        business_id: business.id,
        customer_id: customer.id,
        rating: rrPlan.feedback.rating,
        comment: rrPlan.feedback.comment,
        status: rrPlan.feedback.rating >= 4 ? 'acknowledged' : 'new',
        created_at: daysAgo(rrPlan.daysAgo - 1).toISOString(),
      });
      if (feedbackError) throw new Error(`Failed to insert feedback for ${customer.name}: ${feedbackError.message}`);
    }
  }

  // A rebooking-reminder message + click for one lapsed/at-risk customer so
  // Analytics' "revenue from rebooking reminders" has something to show.
  if (profile === 'at_risk') {
    const sendAt = daysAgo(40);
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        business_id: business.id,
        customer_id: customer.id,
        purpose: 'rebooking_reminder',
        channel: 'email',
        status: 'sent',
        send_at: sendAt.toISOString(),
        sent_at: sendAt.toISOString(),
      })
      .select('*')
      .single();
    if (error || !message) throw new Error(`Failed to insert rebooking message for ${customer.name}: ${error?.message}`);

    const clickAt = daysAgo(39);
    await supabase.from('interaction_events').insert({
      business_id: business.id,
      message_id: message.id,
      customer_id: customer.id,
      event_type: 'click',
      occurred_at: clickAt.toISOString(),
    });

    // A visit shortly after the click, so revenue attribution has a match.
    await supabase.from('visits').insert({
      business_id: business.id,
      customer_id: customer.id,
      service_id: serviceByName.get('Haircut')?.id ?? null,
      visited_at: daysAgo(37).toISOString(),
      price: 45,
      notes: 'Booked after rebooking reminder email',
    });
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
