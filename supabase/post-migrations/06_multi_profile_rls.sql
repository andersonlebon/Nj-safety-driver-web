-- Multi-profile RLS and auth helpers.

-- ---------------------------------------------------------------------
-- Link table RLS
-- ---------------------------------------------------------------------
alter table public.user_profile_links enable row level security;

drop policy if exists "user_profile_links_select_own" on public.user_profile_links;
create policy "user_profile_links_select_own"
on public.user_profile_links for select
using (user_id = auth.uid());

drop policy if exists "user_profile_links_admin_write" on public.user_profile_links;
create policy "user_profile_links_admin_write"
on public.user_profile_links for all
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- ---------------------------------------------------------------------
-- Helpers: all profile ids owned by the signed-in auth user
-- ---------------------------------------------------------------------
create or replace function public.user_profile_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid()
  union
  select id from public.profiles where id = auth.uid();
$$;

create or replace function public.active_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select profile_id
      from public.user_profile_links
      where user_id = auth.uid()
      order by created_at asc
      limit 1
    ),
    auth.uid()
  );
$$;

-- Active profile role (first linked profile for the auth user).
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = public.active_profile_id();
$$;

-- ---------------------------------------------------------------------
-- profiles policies — allow access to any profile owned by auth user
-- ---------------------------------------------------------------------
drop policy if exists "profiles_select_self_or_staff" on public.profiles;
create policy "profiles_select_self_or_staff"
on public.profiles for select
using (
  user_id = auth.uid()
  or id = auth.uid()
  or public.current_role() in ('agent', 'admin')
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
with check (user_id = auth.uid() or id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
using (
  user_id = auth.uid()
  or id = auth.uid()
  or public.current_role() = 'admin'
)
with check (
  user_id = auth.uid()
  or id = auth.uid()
  or public.current_role() = 'admin'
);

-- ---------------------------------------------------------------------
-- handle_new_user — seed driver profile + link row
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, email, full_name, role)
  values (
    new.id,
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'driver'
  )
  on conflict (id) do nothing;

  insert into public.user_profile_links (user_id, profile_id, profile_type)
  values (new.id, new.id, 'driver')
  on conflict (user_id, profile_type) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Sync link row when profile role changes (legacy path)
-- ---------------------------------------------------------------------
create or replace function public.sync_user_profile_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profile_links (user_id, profile_id, profile_type)
  values (new.user_id, new.id, new.role)
  on conflict (user_id, profile_type) do update
    set profile_id = excluded.profile_id;
  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_user_profile_link on public.profiles;
create trigger trg_profiles_sync_user_profile_link
after insert or update of role, user_id on public.profiles
for each row execute function public.sync_user_profile_link();

-- ---------------------------------------------------------------------
-- Role extension tables — match any owned profile id
-- ---------------------------------------------------------------------
drop policy if exists "driver_profiles_select_self_or_staff" on public.driver_profiles;
create policy "driver_profiles_select_self_or_staff"
on public.driver_profiles for select
using (
  profile_id in (select public.user_profile_ids())
  or public.current_role() in ('agent', 'admin')
);

drop policy if exists "agent_profiles_select_self_or_admin" on public.agent_profiles;
create policy "agent_profiles_select_self_or_admin"
on public.agent_profiles for select
using (
  profile_id in (select public.user_profile_ids())
  or public.current_role() = 'admin'
);

drop policy if exists "admin_profiles_select_self_or_admin" on public.admin_profiles;
create policy "admin_profiles_select_self_or_admin"
on public.admin_profiles for select
using (
  profile_id in (select public.user_profile_ids())
  or public.current_role() = 'admin'
);
