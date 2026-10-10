-- 0018_review_link_click_tracking.sql
-- End-to-end review-link click tracking.
--
-- Background: clicks from messages-based sends (review queue, CSV import,
-- manual send, journeys) were written to interaction_events, but the
-- dashboard only counted the legacy click_events table, so they never showed
-- up. This migration adds:
--   * an unguessable per-send tracking token used in the emailed /r/{token} link
--   * per-send click counters (click_count / first_clicked_at / last_clicked_at
--     / destination_url) on both messages and the legacy review_requests table
--   * richer interaction_events rows (review_link_clicked / review_link_scan)
--     with request/campaign ids, user agent, anonymised IP and destination
--
-- Additive and idempotent. Existing rows keep working: old emails keep using
-- /api/track/{id} and /api/track-message/{id}, which are still served.
-- NOTE: add-column-with-volatile-default rewrites the table and gives every
-- existing row its own distinct token, so no separate backfill is needed.

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
alter table public.messages
  add column if not exists tracking_token text not null default replace(gen_random_uuid()::text, '-', ''),
  add column if not exists click_count integer not null default 0,
  add column if not exists first_clicked_at timestamptz,
  add column if not exists last_clicked_at timestamptz,
  add column if not exists destination_url text;

create unique index if not exists messages_tracking_token_key on public.messages (tracking_token);

-- ---------------------------------------------------------------------------
-- review_requests (legacy single-send flow)
-- ---------------------------------------------------------------------------
alter table public.review_requests
  add column if not exists tracking_token text not null default replace(gen_random_uuid()::text, '-', ''),
  add column if not exists click_count integer not null default 0,
  add column if not exists first_clicked_at timestamptz,
  add column if not exists last_clicked_at timestamptz,
  add column if not exists destination_url text;

create unique index if not exists review_requests_tracking_token_key on public.review_requests (tracking_token);

-- Backfill counters from the legacy click_events log so historical numbers
-- stay consistent with the new per-request columns.
update public.review_requests rr
set click_count = c.cnt,
    first_clicked_at = c.first_at,
    last_clicked_at = c.last_at
from (
  select review_request_id, count(*) as cnt, min(clicked_at) as first_at, max(clicked_at) as last_at
  from public.click_events
  group by review_request_id
) c
where rr.id = c.review_request_id
  and rr.click_count = 0;

-- Same for messages, from historical interaction_events clicks.
update public.messages m
set click_count = c.cnt,
    first_clicked_at = c.first_at,
    last_clicked_at = c.last_at
from (
  select message_id, count(*) as cnt, min(occurred_at) as first_at, max(occurred_at) as last_at
  from public.interaction_events
  where event_type = 'click' and message_id is not null
  group by message_id
) c
where m.id = c.message_id
  and m.click_count = 0;

-- ---------------------------------------------------------------------------
-- interaction_events
--   review_link_clicked : a counted (human) click          -> REVIEW_LINK_CLICKED
--   review_link_scan    : automated hit (security scanner / link preview / bot);
--                         stored for audit but never counted in analytics
--   click               : historical clicks written before this migration
-- ---------------------------------------------------------------------------
alter table public.interaction_events drop constraint if exists interaction_events_event_type_check;
alter table public.interaction_events add constraint interaction_events_event_type_check
  check (event_type in ('click', 'review_confirmed', 'feedback_submitted', 'review_link_clicked', 'review_link_scan'));

alter table public.interaction_events
  add column if not exists review_request_id uuid references public.review_requests (id) on delete cascade,
  add column if not exists campaign_id uuid,
  add column if not exists user_agent text,
  add column if not exists ip_address text,
  add column if not exists destination_url text;

create index if not exists interaction_events_review_request_id_idx on public.interaction_events (review_request_id);

notify pgrst, 'reload schema';
