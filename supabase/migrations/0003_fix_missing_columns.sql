-- Migration: fix columns silently skipped by schema.sql on pre-existing
-- tables.
--
-- Root cause: schema.sql defines every table with
-- `create table if not exists public.<table> (...)`. Postgres treats this
-- as a complete no-op when the table already exists — it does NOT add any
-- new columns listed in the statement, even ones that were introduced in a
-- later version of schema.sql. `customers` and `businesses` both pre-date
-- the platform build-out (they existed from the original MVP), so when
-- schema.sql was run against this database, the new columns added to
-- those two tables' `create table` statements were silently never created:
--
--   customers.phone                 (added to add-customer form + CSV path)
--   customers.date_of_birth         (added for birthday campaigns)
--   customers.source                (added for lead-source attribution)
--   customers.unsubscribed_sms_at   (added for SMS consent tracking)
--   businesses.brand_logo_url       (added for branding)
--   businesses.brand_primary_color  (added for branding)
--
-- All other new tables introduced in the same version of schema.sql
-- (business_members, services, visits, messages, journeys,
-- journey_enrollments, loyalty_programs, loyalty_ledger_entries,
-- referrals, segments, private_feedback, interaction_events,
-- customer_tags, import_jobs) did NOT hit this bug, because those tables
-- did not already exist — `create table if not exists` only fails to add
-- columns when the table already exists; it works correctly for genuinely
-- new tables.
--
-- This migration uses explicit `alter table ... add column if not
-- exists`, the same pattern already used successfully in
-- 0001_retry_and_consent.sql, which is immune to this failure mode
-- regardless of whether the table is pre-existing or new. Safe to run
-- multiple times and safe to run on a database that already has some or
-- all of these columns (e.g. a fresh project created after schema.sql was
-- fixed — see the companion fix in schema.sql itself).

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
alter table public.customers
  add column if not exists phone text,
  add column if not exists date_of_birth date,
  add column if not exists source text,
  add column if not exists unsubscribed_sms_at timestamptz;

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists brand_logo_url text,
  add column if not exists brand_primary_color text;
