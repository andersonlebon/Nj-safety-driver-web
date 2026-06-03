-- RLS & constraints for foreign / border transit vehicles

-- Replace global unique plate with per-country uniqueness
alter table public.vehicles drop constraint if exists vehicles_plate_number_key;
drop index if exists vehicles_plate_number_key;
create unique index if not exists vehicles_plate_country_unique
  on public.vehicles (plate_number, registration_country);

alter table public.vehicles drop constraint if exists vehicles_owner_or_transit;
alter table public.vehicles add constraint vehicles_owner_or_transit check (
  owner_id is not null or is_border_transit = true
);

-- Agents may register border transit vehicles (no owner account yet)
drop policy if exists "vehicles_insert_agent_border" on public.vehicles;
create policy "vehicles_insert_agent_border"
on public.vehicles for insert
to authenticated
with check (
  owner_id = auth.uid()
  or public.current_role() in ('agent', 'admin')
);

-- Replace owner-only insert policy name for clarity
drop policy if exists "vehicles_insert_owner" on public.vehicles;
