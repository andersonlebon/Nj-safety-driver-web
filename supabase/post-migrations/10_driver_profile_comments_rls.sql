-- Allow drivers and staff to append profile chat comments on driver_profiles.
drop policy if exists "driver_profiles_update_comments" on public.driver_profiles;
create policy "driver_profiles_update_comments"
on public.driver_profiles for update
to authenticated
using (
  profile_id in (select public.user_profile_ids())
  or public.is_staff()
)
with check (
  profile_id in (select public.user_profile_ids())
  or public.is_staff()
);
