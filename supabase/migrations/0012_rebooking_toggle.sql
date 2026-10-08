-- Owner can switch automatic rebooking reminders on/off. Safe to re-run.
alter table public.businesses add column if not exists rebooking_reminders_enabled boolean not null default true;
