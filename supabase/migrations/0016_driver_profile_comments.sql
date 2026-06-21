-- Manual profile chat stored on driver_profiles (no separate messages table).
alter table public.driver_profiles
  add column if not exists profile_comments jsonb not null default '[]'::jsonb;
