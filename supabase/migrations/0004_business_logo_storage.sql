-- Migration: business logo storage bucket.
-- Adds a public Supabase Storage bucket for business profile/logo images,
-- plus RLS policies scoped the same way as every other business-owned
-- table: a user may read/write an object only if its storage path starts
-- with the id of a business they belong to (checked via business_members).
--
-- Run this AFTER 0001/0002/0003 by pasting it into the Supabase SQL editor.
-- Safe to re-run: uses `insert ... on conflict do nothing` for the bucket
-- and `drop policy if exists` / `create policy` for policies.
--
-- Upload path convention enforced by the app (see
-- src/app/(app)/settings/actions.ts): "<business_id>/logo.<ext>".
-- storage.foldername(name) splits that path on "/", so [1] is the
-- business_id segment.

insert into storage.buckets (id, name, public)
values ('business-logos', 'business-logos', true)
on conflict (id) do nothing;

drop policy if exists "Business logos are publicly readable" on storage.objects;
create policy "Business logos are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'business-logos');

drop policy if exists "Member can upload own business logo" on storage.objects;
create policy "Member can upload own business logo"
  on storage.objects
  for insert
  with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1]::uuid in (
      select business_id from public.business_members where user_id = auth.uid()
    )
  );

drop policy if exists "Member can update own business logo" on storage.objects;
create policy "Member can update own business logo"
  on storage.objects
  for update
  using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1]::uuid in (
      select business_id from public.business_members where user_id = auth.uid()
    )
  );

drop policy if exists "Member can delete own business logo" on storage.objects;
create policy "Member can delete own business logo"
  on storage.objects
  for delete
  using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1]::uuid in (
      select business_id from public.business_members where user_id = auth.uid()
    )
  );
