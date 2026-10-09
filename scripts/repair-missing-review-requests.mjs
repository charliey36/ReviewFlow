#!/usr/bin/env node

/**
 * Repair script for CSV import bug: review requests not created.
 * 
 * This script finds customers that have:
 * - Service date (visits)
 * - But NO review request messages
 * 
 * And creates the missing review requests.
 * 
 * Usage:
 *   SUPABASE_URL="..." SUPABASE_KEY="..." node scripts/repair-missing-review-requests.mjs
 * 
 * Or with .env.local:
 *   node --env-file=.env.local scripts/repair-missing-review-requests.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function daysSinceService(dateStr) {
  if (!dateStr) return null;
  const DAY_MS = 86_400_000;
  const t = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - t) / DAY_MS);
}

function reviewSendTime(serviceDate) {
  const TZ = 'Europe/London';
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  function londonParts(ms) {
    const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, Number(x.value)]));
    return { y: p.year, m: p.month, d: p.day, hour: p.hour, minute: p.minute };
  }

  function londonToUtc(y, m, d, hour) {
    const guess = Date.UTC(y, m - 1, d, hour);
    const offsetAt = (ms) => {
      const p = londonParts(ms);
      return Date.UTC(p.y, p.m - 1, p.d, p.hour, p.minute) - ms;
    };
    return new Date(guess - offsetAt(guess - offsetAt(guess)));
  }

  const [y, m, d] = serviceDate.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return londonToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 9);
}

async function repairMissingReviewRequests() {
  console.log('🔧 Repairing missing review requests...\n');

  // Get all businesses
  const { data: businesses, error: businessError } = await supabase.from('businesses').select('id, name, review_request_window_days');
  if (businessError) {
    console.error('❌ Failed to load businesses:', businessError.message);
    process.exit(1);
  }

  let totalRepaired = 0;

  for (const business of businesses) {
    console.log(`📊 Processing business: ${business.name} (${business.id})`);

    const windowDays = business.review_request_window_days ?? 14;

    // Get all customers with their latest visit
    const { data: customersWithVisits, error: visitError } = await supabase.rpc('get_customers_with_visits_needing_review_requests', {
      business_id: business.id,
      review_window_days: windowDays,
    });

    if (visitError) {
      // If the RPC doesn't exist, fall back to manual query
      console.log('   (Using manual query)');

      const { data: customers } = await supabase
        .from('customers')
        .select('id, email, last_service_date')
        .eq('business_id', business.id);

      if (!customers || customers.length === 0) {
        console.log('   No customers found');
        continue;
      }

      for (const customer of customers) {
        if (!customer.last_service_date) continue;

        // Check if they already have a review request
        const { data: existing } = await supabase
          .from('messages')
          .select('id')
          .eq('business_id', business.id)
          .eq('customer_id', customer.id)
          .eq('purpose', 'review_request')
          .in('status', ['queued', 'pending', 'sent']);

        if (existing && existing.length > 0) continue;

        // Check if the service date is within window
        const days = await daysSinceService(customer.last_service_date);
        if (days === null || days < 0 || days > windowDays) continue;

        // Create review request
        const sendAt = reviewSendTime(customer.last_service_date);
        const { error: insertError } = await supabase.from('messages').insert({
          business_id: business.id,
          customer_id: customer.id,
          purpose: 'review_request',
          channel: 'email',
          status: 'pending',
          send_at: sendAt.toISOString(),
          journey_enrollment_id: null,
          visit_id: null,
        });

        if (insertError) {
          console.error(`   ❌ Failed to create review request for ${customer.email}:`, insertError.message);
        } else {
          console.log(`   ✅ Created review request for ${customer.email}`);
          totalRepaired++;
        }
      }

      continue;
    }

    // Use RPC results if available
    if (!customersWithVisits || customersWithVisits.length === 0) {
      console.log('   No customers need repair');
      continue;
    }

    // Get the journey for this business
    const { data: journey } = await supabase
      .from('journeys')
      .select('id')
      .eq('business_id', business.id)
      .eq('key', 'review_sequence')
      .eq('is_active', true)
      .maybeSingle();

    for (const customer of customersWithVisits) {
      const sendAt = reviewSendTime(customer.last_service_date);

      // Create journey enrollment if journey exists
      let journeyEnrollmentId = null;
      if (journey) {
        const { data: enrollment, error: enrollError } = await supabase
          .from('journey_enrollments')
          .insert({
            journey_id: journey.id,
            business_id: business.id,
            customer_id: customer.id,
            current_step: 0,
          })
          .select('id')
          .single();

        if (enrollError) {
          console.error(`   ❌ Failed to create enrollment for ${customer.email}:`, enrollError.message);
          continue;
        }
        journeyEnrollmentId = enrollment.id;
      }

      // Create review request message
      const { error: insertError } = await supabase.from('messages').insert({
        business_id: business.id,
        customer_id: customer.id,
        purpose: 'review_request',
        channel: 'email',
        status: 'pending',
        send_at: sendAt.toISOString(),
        journey_enrollment_id: journeyEnrollmentId,
        visit_id: null,
      });

      if (insertError) {
        console.error(`   ❌ Failed to create review request for ${customer.email}:`, insertError.message);
      } else {
        console.log(`   ✅ Created review request for ${customer.email} (${customer.last_service_date})`);
        totalRepaired++;
      }
    }
  }

  console.log(`\n✅ Repair complete! Created ${totalRepaired} missing review requests.`);
  process.exit(0);
}

repairMissingReviewRequests().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
