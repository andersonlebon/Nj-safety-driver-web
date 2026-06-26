-- Allow staff to append vehicle review comments (and other staff vehicle updates).
drop policy if exists "vehicles_update_staff" on public.vehicles;
create policy "vehicles_update_staff"
on public.vehicles for update
to authenticated
using (public.is_staff())
with check (public.is_staff());
