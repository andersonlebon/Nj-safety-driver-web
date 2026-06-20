-- Allow multiple profiles per auth user (e.g. driver + staff/agent).
-- Replaces profiles_user_id_unique with one row per (user_id, role).

alter table public.profiles
  drop constraint if exists profiles_user_id_unique;

alter table public.profiles
  drop constraint if exists profiles_user_id_role_unique;

alter table public.profiles
  add constraint profiles_user_id_role_unique unique (user_id, role);
