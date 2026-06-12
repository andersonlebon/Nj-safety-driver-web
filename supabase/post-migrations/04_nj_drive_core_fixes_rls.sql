-- RLS, triggers, and access policies for Nj-Drive workflow additions.

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_infraction_templates_updated_at on public.infraction_templates;
create trigger trg_infraction_templates_updated_at
before update on public.infraction_templates
for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;
alter table public.infraction_templates enable row level security;
alter table public.driver_messages enable row level security;

drop policy if exists "transactions_select_staff_or_driver" on public.transactions;
create policy "transactions_select_staff_or_driver"
on public.transactions for select
to authenticated
using (
  public.current_role() in ('agent', 'admin')
  or exists (
    select 1
    from public.infractions i
    where i.id = transactions.infraction_id
      and i.driver_id = auth.uid()
  )
);

drop policy if exists "transactions_insert_staff" on public.transactions;
create policy "transactions_insert_staff"
on public.transactions for insert
to authenticated
with check (public.current_role() in ('agent', 'admin'));

drop policy if exists "transactions_update_staff" on public.transactions;
create policy "transactions_update_staff"
on public.transactions for update
to authenticated
using (public.current_role() in ('agent', 'admin'))
with check (public.current_role() in ('agent', 'admin'));

drop policy if exists "infraction_templates_select_staff" on public.infraction_templates;
create policy "infraction_templates_select_staff"
on public.infraction_templates for select
to authenticated
using (public.current_role() in ('agent', 'admin'));

drop policy if exists "infraction_templates_write_admin" on public.infraction_templates;
create policy "infraction_templates_write_admin"
on public.infraction_templates for all
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

drop policy if exists "driver_messages_select_driver_or_staff" on public.driver_messages;
create policy "driver_messages_select_driver_or_staff"
on public.driver_messages for select
to authenticated
using (
  driver_id = auth.uid()
  or public.current_role() in ('agent', 'admin')
);

drop policy if exists "driver_messages_insert_staff" on public.driver_messages;
create policy "driver_messages_insert_staff"
on public.driver_messages for insert
to authenticated
with check (public.current_role() in ('agent', 'admin'));

