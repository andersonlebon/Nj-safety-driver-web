-- =====================================================================
-- NJ Safety Driver - Database Schema
-- =====================================================================
-- Run this in the Supabase SQL Editor of a fresh project.
-- It creates: enums, tables, indexes, triggers, RLS policies and storage buckets.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('driver', 'agent', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid', 'paid', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_type as enum (
    'identity',
    'driver_license',
    'insurance',
    'technical_inspection',
    'other'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Helper: updated_at trigger
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

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'driver',
  full_name text,
  phone text,
  national_id text unique,
  driver_license text unique,
  address text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up
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
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'driver')
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
-- vehicles
-- ---------------------------------------------------------------------
create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plate_number text not null unique,
  brand text,
  model text,
  color text,
  year integer,
  insurance_status boolean not null default false,
  inspection_status boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_owner on public.vehicles(owner_id);
create index if not exists idx_vehicles_plate on public.vehicles(plate_number);

drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  doc_type document_type not null,
  file_path text not null,
  file_name text,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_documents_owner on public.documents(owner_id);

-- ---------------------------------------------------------------------
-- infractions
-- ---------------------------------------------------------------------
create table if not exists public.infractions (
  id uuid primary key default uuid_generate_v4(),
  plate_number text not null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_id uuid references public.profiles(id) on delete set null,
  agent_id uuid references public.profiles(id) on delete set null,
  infraction_type text not null,
  description text,
  location text,
  fine_amount numeric(10,2) not null default 0,
  status payment_status not null default 'unpaid',
  evidence_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_infractions_plate on public.infractions(plate_number);
create index if not exists idx_infractions_driver on public.infractions(driver_id);
create index if not exists idx_infractions_agent on public.infractions(agent_id);
create index if not exists idx_infractions_status on public.infractions(status);

drop trigger if exists trg_infractions_updated_at on public.infractions;
create trigger trg_infractions_updated_at
before update on public.infractions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.documents enable row level security;
alter table public.infractions enable row level security;

-- ---------------------------------------------------------------------
-- Helper: role lookup (security definer to avoid recursive policies)
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
-- profiles policies
-- ---------------------------------------------------------------------
drop policy if exists "profiles_select_self_or_staff" on public.profiles;
create policy "profiles_select_self_or_staff"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or public.current_role() in ('agent', 'admin')
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

-- INSERT happens via the auth trigger (security definer); no manual insert policy needed.

-- ---------------------------------------------------------------------
-- vehicles policies
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- documents policies
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- infractions policies
-- ---------------------------------------------------------------------
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

-- =====================================================================
-- Storage buckets
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Storage policies
-- ---------------------------------------------------------------------
-- documents bucket: users can read/upload only their own folder; staff can read all.
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

-- evidence bucket: only agents/admins can upload; agents/admins/owners can read.
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
