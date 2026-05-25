-- Vehicle tracking events — RLS (idempotent)

alter table public.vehicle_tracking_events enable row level security;

drop policy if exists "tracking_select" on public.vehicle_tracking_events;
create policy "tracking_select"
on public.vehicle_tracking_events for select
to authenticated
using (
  public.current_role() in ('agent', 'admin')
  or exists (
    select 1 from public.vehicles v
    where v.id = vehicle_tracking_events.vehicle_id
      and v.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.vehicles v
    where v.plate_number = vehicle_tracking_events.plate_number
      and v.owner_id = auth.uid()
  )
);

drop policy if exists "tracking_insert_staff" on public.vehicle_tracking_events;
create policy "tracking_insert_staff"
on public.vehicle_tracking_events for insert
to authenticated
with check (
  public.current_role() in ('agent', 'admin')
);

-- Backfill tracking events from existing infractions (safe to re-run)
insert into public.vehicle_tracking_events (
  vehicle_id,
  plate_number,
  event_type,
  location,
  recorded_by,
  infraction_id,
  notes,
  created_at
)
select
  i.vehicle_id,
  i.plate_number,
  'infraction'::tracking_event_type,
  i.location,
  i.agent_id,
  i.id,
  i.infraction_type,
  i.created_at
from public.infractions i
where not exists (
  select 1 from public.vehicle_tracking_events e
  where e.infraction_id = i.id
);

-- Backfill registration events for vehicles
insert into public.vehicle_tracking_events (
  vehicle_id,
  plate_number,
  event_type,
  location,
  notes,
  created_at
)
select
  v.id,
  v.plate_number,
  'registration'::tracking_event_type,
  null,
  concat('Vehicle registered: ', coalesce(v.brand, ''), ' ', coalesce(v.model, '')),
  v.created_at
from public.vehicles v
where not exists (
  select 1 from public.vehicle_tracking_events e
  where e.vehicle_id = v.id
    and e.event_type = 'registration'
);
