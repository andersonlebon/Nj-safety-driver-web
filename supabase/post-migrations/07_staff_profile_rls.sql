-- RLS for the new driver/staff profile model.
-- Replaces 06_multi_profile_rls.sql logic.

-- ── Helper functions ──────────────────────────────────────────────────────────

-- Returns all profile IDs owned by the signed-in user.
create or replace function public.user_profile_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

-- Returns true if the signed-in user has a staff profile with the given sub-role.
create or replace function public.has_staff_role(p_role public.staff_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.staff_profiles sp on sp.profile_id = p.id
    where p.user_id = auth.uid()
      and p.role = 'staff'
      and sp.staff_role = p_role
      and (p_role = 'admin' or sp.application_status = 'approved')
  );
$$;

-- Returns true if the signed-in user is any staff (approved agent or admin).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.staff_profiles sp on sp.profile_id = p.id
    where p.user_id = auth.uid()
      and p.role = 'staff'
      and (sp.staff_role = 'admin' or sp.application_status = 'approved')
  );
$$;

-- ── profiles policies ─────────────────────────────────────────────────────────
drop policy if exists "profiles_select_self_or_staff" on public.profiles;
create policy "profiles_select_self_or_staff"
on public.profiles for select
using (
  user_id = auth.uid()
  or public.is_staff()
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
with check (user_id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
using (
  user_id = auth.uid()
  or public.has_staff_role('admin')
)
with check (
  user_id = auth.uid()
  or public.has_staff_role('admin')
);

-- ── driver_profiles policies ──────────────────────────────────────────────────
drop policy if exists "driver_profiles_select_self_or_staff" on public.driver_profiles;
create policy "driver_profiles_select_self_or_staff"
on public.driver_profiles for select
using (
  profile_id in (select public.user_profile_ids())
  or public.is_staff()
);

drop policy if exists "driver_profiles_insert_self" on public.driver_profiles;
create policy "driver_profiles_insert_self"
on public.driver_profiles for insert
with check (
  profile_id in (select public.user_profile_ids())
);

-- ── staff_profiles policies ───────────────────────────────────────────────────
drop policy if exists "staff_profiles_select" on public.staff_profiles;
create policy "staff_profiles_select"
on public.staff_profiles for select
using (
  profile_id in (select public.user_profile_ids())
  or public.has_staff_role('admin')
);

drop policy if exists "staff_profiles_insert_self" on public.staff_profiles;
create policy "staff_profiles_insert_self"
on public.staff_profiles for insert
with check (
  profile_id in (select public.user_profile_ids())
);

drop policy if exists "staff_profiles_update_admin" on public.staff_profiles;
create policy "staff_profiles_update_admin"
on public.staff_profiles for update
using (public.has_staff_role('admin'))
with check (public.has_staff_role('admin'));

-- ── Drop old helpers that referenced profile_types / user_role ────────────────
drop function if exists public.has_role(public.user_role);
-- Keep current_role() — other RLS policies (vehicles, documents, …) still use it.

-- ── handle_new_user: no-op (profiles created during registration) ─────────────
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
