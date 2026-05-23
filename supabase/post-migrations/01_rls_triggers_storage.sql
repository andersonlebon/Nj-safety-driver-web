-- =====================================================================
-- NJ Safety Driver — non-table objects
-- =====================================================================
-- Drizzle-generated migrations only contain tables, columns, FKs, and indexes.
-- This file restores everything Drizzle does NOT model:
--   1. uuid-ossp extension (used by uuid_generate_v4 in defaults)
--   2. updated_at trigger function + per-table triggers
--   3. handle_new_user() trigger that auto-creates a profiles row on signup
--   4. current_role() helper (security-definer, used by RLS)
--   5. Row Level Security policies for every public table
--   6. Storage buckets `documents` and `evidence` + their access policies
--
-- It is named `9999_…` so it always runs AFTER the Drizzle migration that
-- creates the tables. Re-run-safe (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 2. updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

drop trigger if exists trg_infractions_updated_at on public.infractions;
create trigger trg_infractions_updated_at
before update on public.infractions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. handle_new_user() — seeds a profiles row when a new auth user signs up
-- ---------------------------------------------------------------------
-- SECURITY: this trigger intentionally IGNORES any `role` value sitting in
-- `raw_user_meta_data`. Previously it honoured that value, which meant any
-- caller of `supabase.auth.signUp({ options: { data: { role: 'admin' } } })`
-- could self-promote on first sign-in. New rows are now always inserted as
-- 'driver'. Staff roles ('agent', 'admin') are only ever granted by:
--   1. the one-time `/setup` bootstrap (uses the Admin API + service role), or
--   2. an existing admin via the admin role-promotion UI.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'driver'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4. current_role() helper — security-definer to avoid recursive RLS
-- ---------------------------------------------------------------------
create or replace function public.current_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.vehicles    enable row level security;
alter table public.documents   enable row level security;
alter table public.infractions enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists "profiles_select_self_or_staff" on public.profiles;
create policy "profiles_select_self_or_staff"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or public.current_role() in ('agent', 'admin')
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
to authenticated
using (
  id = auth.uid()
  or public.current_role() = 'admin'
)
with check (
  id = auth.uid()
  or public.current_role() = 'admin'
);

-- vehicles ------------------------------------------------------------
drop policy if exists "vehicles_select" on public.vehicles;
create policy "vehicles_select"
on public.vehicles for select
to authenticated
using (
  owner_id = auth.uid()
  or public.current_role() in ('agent', 'admin')
);

drop policy if exists "vehicles_insert_owner" on public.vehicles;
create policy "vehicles_insert_owner"
on public.vehicles for insert
to authenticated
with check (
  owner_id = auth.uid()
  or public.current_role() = 'admin'
);

drop policy if exists "vehicles_update_owner_or_admin" on public.vehicles;
create policy "vehicles_update_owner_or_admin"
on public.vehicles for update
to authenticated
using (
  owner_id = auth.uid()
  or public.current_role() = 'admin'
)
with check (
  owner_id = auth.uid()
  or public.current_role() = 'admin'
);

drop policy if exists "vehicles_delete_owner_or_admin" on public.vehicles;
create policy "vehicles_delete_owner_or_admin"
on public.vehicles for delete
to authenticated
using (
  owner_id = auth.uid()
  or public.current_role() = 'admin'
);

-- documents -----------------------------------------------------------
drop policy if exists "documents_select" on public.documents;
create policy "documents_select"
on public.documents for select
to authenticated
using (
  owner_id = auth.uid()
  or public.current_role() in ('agent', 'admin')
);

drop policy if exists "documents_insert_owner" on public.documents;
create policy "documents_insert_owner"
on public.documents for insert
to authenticated
with check (
  owner_id = auth.uid()
  or public.current_role() = 'admin'
);

drop policy if exists "documents_delete_owner_or_admin" on public.documents;
create policy "documents_delete_owner_or_admin"
on public.documents for delete
to authenticated
using (
  owner_id = auth.uid()
  or public.current_role() = 'admin'
);

-- infractions ---------------------------------------------------------
drop policy if exists "infractions_select" on public.infractions;
create policy "infractions_select"
on public.infractions for select
to authenticated
using (
  driver_id = auth.uid()
  or public.current_role() in ('agent', 'admin')
);

drop policy if exists "infractions_insert_agent_admin" on public.infractions;
create policy "infractions_insert_agent_admin"
on public.infractions for insert
to authenticated
with check (
  public.current_role() in ('agent', 'admin')
);

drop policy if exists "infractions_update_agent_admin" on public.infractions;
create policy "infractions_update_agent_admin"
on public.infractions for update
to authenticated
using (public.current_role() in ('agent', 'admin'))
with check (public.current_role() in ('agent', 'admin'));

drop policy if exists "infractions_delete_admin" on public.infractions;
create policy "infractions_delete_admin"
on public.infractions for delete
to authenticated
using (public.current_role() = 'admin');

-- ---------------------------------------------------------------------
-- 6. Storage buckets + policies
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

drop policy if exists "docs_select_owner_or_staff" on storage.objects;
create policy "docs_select_owner_or_staff"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_role() in ('agent', 'admin')
  )
);

drop policy if exists "docs_insert_owner" on storage.objects;
create policy "docs_insert_owner"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "docs_delete_owner_or_admin" on storage.objects;
create policy "docs_delete_owner_or_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_role() = 'admin'
  )
);

drop policy if exists "evidence_select_staff_or_owner" on storage.objects;
create policy "evidence_select_staff_or_owner"
on storage.objects for select
to authenticated
using (
  bucket_id = 'evidence'
  and public.current_role() in ('agent', 'admin', 'driver')
);

drop policy if exists "evidence_insert_staff" on storage.objects;
create policy "evidence_insert_staff"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'evidence'
  and public.current_role() in ('agent', 'admin')
);

drop policy if exists "evidence_delete_admin" on storage.objects;
create policy "evidence_delete_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'evidence'
  and public.current_role() = 'admin'
);
