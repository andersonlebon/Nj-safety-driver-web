-- Profile picture storage path (documents bucket key), scoped to the profile row.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path text;
