-- Payment transactions: drivers submit manual payments; admins review.

drop policy if exists "transactions_select_staff_or_driver" on public.transactions;
create policy "transactions_select_staff_or_driver"
on public.transactions for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1
    from public.infractions i
    where i.id = transactions.infraction_id
      and i.driver_id in (select public.user_profile_ids())
  )
);

drop policy if exists "transactions_insert_staff" on public.transactions;
drop policy if exists "transactions_insert_driver_manual" on public.transactions;
create policy "transactions_insert_driver_manual"
on public.transactions for insert
to authenticated
with check (
  payment_method = 'manual'
  and status = 'pending'
  and submitted_by in (select public.user_profile_ids())
  and exists (
    select 1
    from public.infractions i
    where i.id = transactions.infraction_id
      and i.driver_id = transactions.submitted_by
      and i.driver_id in (select public.user_profile_ids())
      and i.status <> 'paid'
  )
);

drop policy if exists "transactions_update_staff" on public.transactions;
drop policy if exists "transactions_update_admin_review" on public.transactions;
create policy "transactions_update_admin_review"
on public.transactions for update
to authenticated
using (public.has_staff_role('admin'))
with check (public.has_staff_role('admin'));
