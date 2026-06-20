-- Additional query indexes identified in the performance audit (idempotent).

-- Vehicle-scoped infraction lookups (vehicle detail, plate search joins).
CREATE INDEX IF NOT EXISTS infractions_vehicle_id_created_at_idx
  ON public.infractions (vehicle_id, created_at DESC)
  WHERE vehicle_id IS NOT NULL;

-- Transaction ledger filters/aggregations by status + time window
-- (admin overview financials, payment status filters).
CREATE INDEX IF NOT EXISTS transactions_status_created_at_idx
  ON public.transactions (status, created_at DESC);
