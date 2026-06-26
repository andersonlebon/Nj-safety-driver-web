-- Staff vehicle review chat stored on vehicles (same shape as driver profile_comments).
alter table public.vehicles
  add column if not exists vehicle_comments jsonb not null default '[]'::jsonb;
