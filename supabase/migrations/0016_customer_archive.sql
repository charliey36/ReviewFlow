-- 0016_customer_archive.sql
-- Adds a soft-archive flag to customers so the owner can hide a customer
-- from the active list (e.g. a one-off/closed account) without destroying
-- their history. Reversible: clearing archived_at restores them.
--
-- Soft-archive (not a hard delete) so lifetime value, visit history and any
-- sent-message record are preserved and the action is fully undoable.
alter table public.customers
  add column if not exists archived_at timestamptz;

create index if not exists customers_archived_at_idx
  on public.customers (archived_at);
