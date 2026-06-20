-- @skip-if staff_profiles exists
-- =============================================================================
-- 0013_unified_profile_auth.sql
-- Unified single-profile auth redesign.
--
-- Goals:
--   - ONE profiles row per auth user (id = auth.uid()).
--   - profiles.profile_types user_role[] carries all roles for that user.
--   - driver_profiles / agent_profiles / admin_profiles remain as typed
--     sub-tables but each profile_id now points to the single canonical row.
--   - user_profile_links junction table is dropped (no longer needed).
--   - UNIQUE constraint on profiles.user_id enforced.
--   - RLS policies added on all profile-related tables.
--
-- Safety notes:
--   - Every destructive step is guarded with IF EXISTS / ON CONFLICT.
--   - A temporary table (_canon) maps each user_id → canonical profile id.
--   - FK columns in dependent tables are remapped before non-canonical rows
--     are deleted, avoiding orphan references.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- STEP 1 — Add profile_types column (idempotent)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_types public.user_role[] NOT NULL DEFAULT '{}';


-- ---------------------------------------------------------------------------
-- STEP 2 — Seed profile_types from existing role column
--           Only sets rows that are still empty so a re-run is safe.
-- ---------------------------------------------------------------------------

UPDATE public.profiles
SET profile_types = ARRAY[role]
WHERE profile_types = '{}';


-- ---------------------------------------------------------------------------
-- STEP 3 — Build canonical-profile map
--           For each user_id, prefer the row whose id = user_id (the
--           "original" auth profile).  Fall back to oldest by created_at.
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE _canon AS
SELECT DISTINCT ON (user_id)
  user_id,
  id AS canonical_id
FROM public.profiles
WHERE user_id IS NOT NULL
ORDER BY
  user_id,
  CASE WHEN id::text = user_id::text THEN 0 ELSE 1 END ASC,
  created_at ASC;

-- Index for the repeated lookups below.
CREATE INDEX ON _canon (user_id);
CREATE INDEX ON _canon (canonical_id);


-- ---------------------------------------------------------------------------
-- STEP 4 — Merge all roles for a user into the canonical profile row
-- ---------------------------------------------------------------------------

WITH merged AS (
  SELECT
    c.canonical_id,
    array_agg(DISTINCT unnested_role ORDER BY unnested_role) AS types
  FROM _canon c
  JOIN public.profiles p ON p.user_id = c.user_id
  CROSS JOIN LATERAL unnest(p.profile_types) AS unnested_role
  GROUP BY c.canonical_id
)
UPDATE public.profiles AS pr
SET profile_types = merged.types
FROM merged
WHERE pr.id = merged.canonical_id;


-- ---------------------------------------------------------------------------
-- STEP 5 — Remap type sub-tables to canonical profile ids
-- ---------------------------------------------------------------------------

-- 5a. driver_profiles
-- Insert canonical row if it does not already exist.
INSERT INTO public.driver_profiles (profile_id, created_at)
SELECT DISTINCT ON (c.canonical_id)
  c.canonical_id,
  dp.created_at
FROM _canon c
JOIN public.driver_profiles dp ON dp.profile_id IN (
  SELECT id FROM public.profiles WHERE user_id = c.user_id
)
WHERE c.canonical_id != dp.profile_id
ORDER BY c.canonical_id, dp.created_at ASC
ON CONFLICT (profile_id) DO NOTHING;

-- Remove non-canonical driver_profiles rows.
DELETE FROM public.driver_profiles dp
USING public.profiles pr, _canon c
WHERE dp.profile_id = pr.id
  AND pr.user_id = c.user_id
  AND dp.profile_id != c.canonical_id;


-- 5b. agent_profiles
-- Insert canonical row, preserving the first badge_id found.
INSERT INTO public.agent_profiles (profile_id, badge_id, created_at)
SELECT DISTINCT ON (c.canonical_id)
  c.canonical_id,
  ap.badge_id,
  ap.created_at
FROM _canon c
JOIN public.agent_profiles ap ON ap.profile_id IN (
  SELECT id FROM public.profiles WHERE user_id = c.user_id
)
WHERE c.canonical_id != ap.profile_id
ORDER BY c.canonical_id, ap.badge_id NULLS LAST, ap.created_at ASC
ON CONFLICT (profile_id) DO UPDATE
  SET badge_id = COALESCE(EXCLUDED.badge_id, public.agent_profiles.badge_id);

-- Remove non-canonical agent_profiles rows.
DELETE FROM public.agent_profiles ap
USING public.profiles pr, _canon c
WHERE ap.profile_id = pr.id
  AND pr.user_id = c.user_id
  AND ap.profile_id != c.canonical_id;


-- 5c. admin_profiles
-- Insert canonical row if it does not already exist.
INSERT INTO public.admin_profiles (profile_id, created_at)
SELECT DISTINCT ON (c.canonical_id)
  c.canonical_id,
  adp.created_at
FROM _canon c
JOIN public.admin_profiles adp ON adp.profile_id IN (
  SELECT id FROM public.profiles WHERE user_id = c.user_id
)
WHERE c.canonical_id != adp.profile_id
ORDER BY c.canonical_id, adp.created_at ASC
ON CONFLICT (profile_id) DO NOTHING;

-- Remove non-canonical admin_profiles rows.
DELETE FROM public.admin_profiles adp
USING public.profiles pr, _canon c
WHERE adp.profile_id = pr.id
  AND pr.user_id = c.user_id
  AND adp.profile_id != c.canonical_id;


-- ---------------------------------------------------------------------------
-- STEP 6 — Remap FK references in dependent tables to canonical profile ids
-- ---------------------------------------------------------------------------

-- 6a. vehicles.owner_id
UPDATE public.vehicles v
SET owner_id = c.canonical_id
FROM public.profiles pr, _canon c
WHERE v.owner_id = pr.id
  AND pr.user_id = c.user_id
  AND v.owner_id != c.canonical_id;

-- 6b. infractions.driver_id
UPDATE public.infractions i
SET driver_id = c.canonical_id
FROM public.profiles pr, _canon c
WHERE i.driver_id = pr.id
  AND pr.user_id = c.user_id
  AND i.driver_id != c.canonical_id;

-- 6c. infractions.agent_id
UPDATE public.infractions i
SET agent_id = c.canonical_id
FROM public.profiles pr, _canon c
WHERE i.agent_id = pr.id
  AND pr.user_id = c.user_id
  AND i.agent_id != c.canonical_id;

-- 6d. documents.owner_id
UPDATE public.documents d
SET owner_id = c.canonical_id
FROM public.profiles pr, _canon c
WHERE d.owner_id = pr.id
  AND pr.user_id = c.user_id
  AND d.owner_id != c.canonical_id;

-- 6e. document_groups.owner_id
UPDATE public.document_groups dg
SET owner_id = c.canonical_id
FROM public.profiles pr, _canon c
WHERE dg.owner_id = pr.id
  AND pr.user_id = c.user_id
  AND dg.owner_id != c.canonical_id;

-- 6f. driver_messages.driver_id
UPDATE public.driver_messages dm
SET driver_id = c.canonical_id
FROM public.profiles pr, _canon c
WHERE dm.driver_id = pr.id
  AND pr.user_id = c.user_id
  AND dm.driver_id != c.canonical_id;

-- 6g. driver_messages.sender_id
UPDATE public.driver_messages dm
SET sender_id = c.canonical_id
FROM public.profiles pr, _canon c
WHERE dm.sender_id = pr.id
  AND pr.user_id = c.user_id
  AND dm.sender_id != c.canonical_id;

-- 6h. vehicle_tracking_events.recorded_by
UPDATE public.vehicle_tracking_events vte
SET recorded_by = c.canonical_id
FROM public.profiles pr, _canon c
WHERE vte.recorded_by = pr.id
  AND pr.user_id = c.user_id
  AND vte.recorded_by != c.canonical_id;


-- ---------------------------------------------------------------------------
-- STEP 7 — Delete non-canonical profile rows
--           All FK children have been remapped; the CASCADE on type tables
--           is now safe since we already cleaned them in step 5.
-- ---------------------------------------------------------------------------

DELETE FROM public.profiles pr
USING _canon c
WHERE pr.user_id = c.user_id
  AND pr.id != c.canonical_id;

-- Clean up temp table.
DROP TABLE IF EXISTS _canon;


-- ---------------------------------------------------------------------------
-- STEP 8 — Drop user_profile_links (no longer needed)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS public.user_profile_links;


-- ---------------------------------------------------------------------------
-- STEP 9 — Add UNIQUE constraint on profiles.user_id
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_id_unique;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);


-- ---------------------------------------------------------------------------
-- STEP 10 — RLS policies
-- ---------------------------------------------------------------------------

-- profiles -------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so the migration is idempotent.
DROP POLICY IF EXISTS "profiles_own_access"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_full_access" ON public.profiles;

-- Users can read/write their own profile row.
CREATE POLICY "profiles_own_access"
  ON public.profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins have full unrestricted access to all profile rows.
-- An admin is any authenticated user whose canonical profiles row carries
-- the 'admin' role in profile_types.
CREATE POLICY "profiles_admin_full_access"
  ON public.profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.profile_types @> ARRAY['admin'::public.user_role]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.profile_types @> ARRAY['admin'::public.user_role]
    )
  );


-- driver_profiles ------------------------------------------------------------

ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_profiles_own_access"       ON public.driver_profiles;
DROP POLICY IF EXISTS "driver_profiles_admin_full_access" ON public.driver_profiles;

CREATE POLICY "driver_profiles_own_access"
  ON public.driver_profiles
  FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "driver_profiles_admin_full_access"
  ON public.driver_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.profile_types @> ARRAY['admin'::public.user_role]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.profile_types @> ARRAY['admin'::public.user_role]
    )
  );


-- agent_profiles -------------------------------------------------------------

ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_profiles_own_access"       ON public.agent_profiles;
DROP POLICY IF EXISTS "agent_profiles_admin_full_access" ON public.agent_profiles;

CREATE POLICY "agent_profiles_own_access"
  ON public.agent_profiles
  FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "agent_profiles_admin_full_access"
  ON public.agent_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.profile_types @> ARRAY['admin'::public.user_role]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.profile_types @> ARRAY['admin'::public.user_role]
    )
  );


-- admin_profiles -------------------------------------------------------------

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_profiles_own_access"       ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_admin_full_access" ON public.admin_profiles;

CREATE POLICY "admin_profiles_own_access"
  ON public.admin_profiles
  FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_profiles_admin_full_access"
  ON public.admin_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.profile_types @> ARRAY['admin'::public.user_role]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.profile_types @> ARRAY['admin'::public.user_role]
    )
  );
