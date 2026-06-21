-- Infraction payments: multiple transactions per infraction, manual receipt approval.

do $$ begin
  create type payment_method as enum ('manual', 'mobile_money', 'card', 'bank_transfer');
exception when duplicate_object then null;
end $$;
--> statement-breakpoint

do $$ begin
  alter type transaction_status add value if not exists 'rejected';
exception when duplicate_object then null;
end $$;
--> statement-breakpoint

alter table public.infractions
  add column if not exists amount_paid numeric(10, 2) not null default 0,
  add column if not exists payment_transaction_count integer not null default 0;
--> statement-breakpoint

alter table public.transactions
  drop constraint if exists transactions_infraction_id_unique;
--> statement-breakpoint

alter table public.transactions
  add column if not exists payment_method payment_method not null default 'manual',
  add column if not exists receipt_path text,
  add column if not exists submitted_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamp with time zone,
  add column if not exists rejection_reason text;
--> statement-breakpoint

create index if not exists transactions_infraction_id_created_at_idx
  on public.transactions (infraction_id, created_at desc);
--> statement-breakpoint

create index if not exists transactions_status_created_at_idx
  on public.transactions (status, created_at desc);
--> statement-breakpoint

-- Backfill payment totals from existing approved rows.
update public.infractions i
set
  amount_paid = coalesce(
    (
      select sum(t.amount::numeric)
      from public.transactions t
      where t.infraction_id = i.id
        and t.status = 'paid'
    ),
    0
  ),
  payment_transaction_count = coalesce(
    (
      select count(*)::integer
      from public.transactions t
      where t.infraction_id = i.id
        and t.status <> 'rejected'
    ),
    0
  );
--> statement-breakpoint

update public.infractions i
set status = 'paid'
where i.amount_paid >= i.fine_amount::numeric
  and i.status <> 'paid';
--> statement-breakpoint

update public.infractions i
set status = 'pending'
where i.amount_paid > 0
  and i.amount_paid < i.fine_amount::numeric
  and i.status = 'unpaid';
--> statement-breakpoint

-- Keep infraction payment totals in sync when transactions change.
create or replace function public.sync_infraction_payment_from_transactions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_infraction_id uuid;
  fine numeric(10, 2);
  paid numeric(10, 2);
  tx_count integer;
  has_pending boolean;
  next_status payment_status;
begin
  target_infraction_id := coalesce(new.infraction_id, old.infraction_id);

  select i.fine_amount::numeric
  into fine
  from public.infractions i
  where i.id = target_infraction_id;

  if fine is null then
    return coalesce(new, old);
  end if;

  select
    coalesce(sum(t.amount::numeric) filter (where t.status = 'paid'), 0),
    count(*) filter (where t.status <> 'rejected')::integer,
    coalesce(bool_or(t.status = 'pending'), false)
  into paid, tx_count, has_pending
  from public.transactions t
  where t.infraction_id = target_infraction_id;

  if paid >= fine then
    next_status := 'paid';
  elsif has_pending or paid > 0 then
    next_status := 'pending';
  else
    next_status := 'unpaid';
  end if;

  update public.infractions
  set
    amount_paid = paid,
    payment_transaction_count = tx_count,
    status = next_status,
    updated_at = now()
  where id = target_infraction_id;

  return coalesce(new, old);
end;
$$;
--> statement-breakpoint

drop trigger if exists trg_sync_infraction_payment on public.transactions;
--> statement-breakpoint

create trigger trg_sync_infraction_payment
after insert or update or delete on public.transactions
for each row
execute function public.sync_infraction_payment_from_transactions();
