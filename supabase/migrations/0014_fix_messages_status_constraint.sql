-- Fix messages.status check constraint to include 'queued' status
-- The original table definition was missing 'queued' in the check constraint
-- This caused CSV imports with autoSend=false to fail

alter table public.messages drop constraint if exists messages_status_check;
alter table public.messages add constraint messages_status_check
  check (status in ('queued', 'pending', 'sent', 'failed', 'cancelled'));
