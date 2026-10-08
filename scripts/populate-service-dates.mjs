// Sets realistic last_service_date values on the Charlie test account's customers.
// Run after migration 0007:  node --env-file=.env.local scripts/populate-service-dates.mjs
import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const EMAIL = 'charlieyoults123@gmail.com';

const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
const user = users.users.find((u) => u.email === EMAIL);
const { data: m } = await admin.from('business_members').select('business_id').eq('user_id', user.id).single();
const { data: customers, error } = await admin
  .from('customers').select('id').eq('business_id', m.business_id).order('created_at').order('id');
if (error) throw error;

// [count, minDaysAgo, maxDaysAgo]: with defaults (review 14d, rebooking 90d)
// 20 are review-eligible, 13 rebooking-eligible, 17 neither.
const bands = [[12, 1, 7], [8, 8, 14], [8, 15, 30], [9, 31, 89], [13, 90, 200]];
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const plan = bands.flatMap(([n, lo, hi]) => Array.from({ length: n }, () => rand(lo, hi)));

for (let i = 0; i < customers.length; i++) {
  const d = new Date(Date.now() - plan[i % plan.length] * 86_400_000).toISOString().slice(0, 10);
  const { error: e } = await admin.from('customers').update({ last_service_date: d }).eq('id', customers[i].id);
  if (e) throw e;
}
console.log(`Updated ${customers.length} customers`);
