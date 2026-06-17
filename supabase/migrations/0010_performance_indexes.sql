-- Performance indexes for common dashboard queries (idempotent).

CREATE INDEX IF NOT EXISTS infractions_driver_id_created_at_idx
  ON public.infractions (driver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS infractions_agent_id_created_at_idx
  ON public.infractions (agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS infractions_plate_country_created_at_idx
  ON public.infractions (plate_number, registration_country, created_at DESC);

CREATE INDEX IF NOT EXISTS infractions_created_at_idx
  ON public.infractions (created_at DESC);

CREATE INDEX IF NOT EXISTS infractions_status_idx
  ON public.infractions (status);

CREATE INDEX IF NOT EXISTS vehicles_owner_id_created_at_idx
  ON public.vehicles (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS vehicles_verification_status_created_at_idx
  ON public.vehicles (verification_status, created_at DESC);

CREATE INDEX IF NOT EXISTS vehicles_is_foreign_idx
  ON public.vehicles (is_foreign)
  WHERE is_foreign = true;

CREATE INDEX IF NOT EXISTS vehicles_border_transit_entry_idx
  ON public.vehicles (is_border_transit, border_entry_at DESC)
  WHERE is_border_transit = true;

CREATE INDEX IF NOT EXISTS documents_vehicle_doc_label_idx
  ON public.documents (vehicle_id, doc_type, label)
  WHERE vehicle_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS documents_owner_uploaded_at_idx
  ON public.documents (owner_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS profiles_role_idx
  ON public.profiles (role);

CREATE INDEX IF NOT EXISTS profiles_agent_application_status_idx
  ON public.profiles (agent_application_status, created_at DESC)
  WHERE agent_application_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS vehicle_tracking_events_plate_created_at_idx
  ON public.vehicle_tracking_events (plate_number, created_at DESC);
