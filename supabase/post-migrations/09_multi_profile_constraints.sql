-- Allow one profile row per role per auth user (driver + staff), not one row total.
alter table public.profiles
  drop constraint if exists profiles_user_id_unique;

alter table public.profiles
  drop constraint if exists profiles_user_id_role_unique;

alter table public.profiles
  add constraint profiles_user_id_role_unique unique (user_id, role);

-- Ensure bootstrap admins are immediately active in staff_profiles.
update public.staff_profiles
set application_status = 'approved'::public.agent_application_status
where staff_role = 'admin'::public.staff_role
  and coalesce(application_status, 'pending'::public.agent_application_status) = 'pending'::public.agent_application_status;
