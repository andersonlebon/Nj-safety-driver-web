-- Migration: driver/staff profile model
-- Replaces the single-profile-with-profile_types model with
-- one profile row per workspace (driver | staff).
-- staff_profiles holds the sub-role (agent | admin).

-- ── New enums ─────────────────────────────────────────────────────────────────
do $$ begin
  create type profile_role as enum ('driver', 'staff');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type staff_role as enum ('agent', 'admin');
exception when duplicate_object then null;
end $$;

-- ── Phase A: migrate profiles.role (user_role) → profiles.role (profile_role) ──
do $$
begin
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'profiles'
      and c.column_name = 'role'
      and c.udt_name = 'user_role'
  ) then
    alter table public.profiles
      add column if not exists profile_role profile_role;

    update public.profiles
    set profile_role = case
      when role::text = 'driver' then 'driver'::profile_role
      else 'staff'::profile_role
    end
    where profile_role is null;

    alter table public.profiles
      alter column profile_role set not null,
      alter column profile_role set default 'driver'::profile_role;

    drop trigger if exists trg_profiles_sync_role_tables on public.profiles;
    drop function if exists public.sync_role_profile_tables();

    alter table public.profiles drop column role;

    alter table public.profiles rename column profile_role to role;
  end if;
end $$;

-- ── Phase B: drop legacy uniqueness (idempotent) ─────────────────────────────
alter table public.profiles
  drop constraint if exists profiles_national_id_key,
  drop constraint if exists profiles_driver_license_key,
  drop constraint if exists profiles_national_id_unique,
  drop constraint if exists profiles_driver_license_unique;

-- ── Phase C: staff_profiles + data migration (idempotent) ────────────────────
create table if not exists public.staff_profiles (
  profile_id   uuid          primary key references public.profiles(id) on delete cascade,
  staff_role   staff_role    not null default 'agent',
  badge_id     text,
  application_status agent_application_status default 'pending',
  application_note   text,
  created_at   timestamptz   not null default now()
);

do $$
begin
  if to_regclass('public.agent_profiles') is not null then
    insert into public.staff_profiles (profile_id, staff_role, badge_id, application_status, application_note, created_at)
    select
      ap.profile_id,
      'agent'::staff_role,
      ap.badge_id,
      coalesce(p.agent_application_status, 'pending'::agent_application_status),
      p.agent_application_note,
      ap.created_at
    from public.agent_profiles ap
    join public.profiles p on p.id = ap.profile_id
    on conflict (profile_id) do nothing;
  end if;

  if to_regclass('public.admin_profiles') is not null then
    insert into public.staff_profiles (profile_id, staff_role, created_at)
    select profile_id, 'admin'::staff_role, created_at
    from public.admin_profiles
    on conflict (profile_id) do update set staff_role = 'admin'::staff_role;
  end if;
end $$;

-- ── Phase D: drop profile_types model (policies/functions first) ─────────────
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'profile_types'
  ) then
    drop policy if exists "profiles_admin_full_access" on public.profiles;
    drop policy if exists "profiles_own_access" on public.profiles;
    drop policy if exists "driver_profiles_admin_full_access" on public.driver_profiles;
    drop policy if exists "driver_profiles_own_access" on public.driver_profiles;
    drop policy if exists "agent_profiles_admin_full_access" on public.agent_profiles;
    drop policy if exists "agent_profiles_own_access" on public.agent_profiles;
    drop policy if exists "admin_profiles_admin_full_access" on public.admin_profiles;
    drop policy if exists "admin_profiles_own_access" on public.admin_profiles;
    drop policy if exists "profiles_select_self_or_staff" on public.profiles;
    drop policy if exists "profiles_insert_self" on public.profiles;
    drop policy if exists "profiles_update_self_or_admin" on public.profiles;
    drop policy if exists "driver_profiles_select_self_or_staff" on public.driver_profiles;
    drop policy if exists "agent_profiles_select_self_or_admin" on public.agent_profiles;
    drop policy if exists "admin_profiles_select_self_or_admin" on public.admin_profiles;

    drop function if exists public.has_role(public.user_role) cascade;
    drop function if exists public.current_role() cascade;

    alter table public.profiles
      drop column profile_types,
      drop column if exists agent_application_status,
      drop column if exists agent_badge_id,
      drop column if exists agent_application_note;
  end if;
end $$;

-- ── Phase E: drop old typed-role tables ───────────────────────────────────────
drop table if exists public.agent_profiles;
drop table if exists public.admin_profiles;

-- ── Update handle_new_user trigger ───────────────────────────────────────────
-- No longer auto-creates a profile on signup.
-- Profiles are created explicitly via the registration flow.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;
