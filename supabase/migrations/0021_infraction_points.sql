-- Snapshot compliance points per infraction (from template at filing time).
ALTER TABLE infractions
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 2;

-- Backfill from active templates where infraction_type matches template label.
UPDATE infractions i
SET points = t.points
FROM infraction_templates t
WHERE i.infraction_type = t.label;
