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
alter table public.driver_profiles enable row level security;
do $$
begin
  if to_regclass('public.agent_profiles') is not null then
    execute 'alter table public.agent_profiles enable row level security';
  end if;
  if to_regclass('public.admin_profiles') is not null then
    execute 'alter table public.admin_profiles enable row level security';
  end if;
end $$;

do $$
begin
  if to_regclass('public.staff_profiles') is not null then
    drop trigger if exists trg_profiles_sync_role_tables on public.profiles;
    drop function if exists public.sync_role_profile_tables();
    return;
  end if;

  create or replace function public.sync_role_profile_tables()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $fn$
  begin
    delete from public.driver_profiles where profile_id = new.id;
    delete from public.agent_profiles where profile_id = new.id;
    delete from public.admin_profiles where profile_id = new.id;

    if new.role = 'driver' then
      insert into public.driver_profiles (profile_id)
      values (new.id)
      on conflict (profile_id) do nothing;
    elsif new.role = 'agent' then
      insert into public.agent_profiles (profile_id, badge_id)
      values (new.id, new.agent_badge_id)
      on conflict (profile_id) do update set badge_id = excluded.badge_id;
    elsif new.role = 'admin' then
      insert into public.admin_profiles (profile_id)
      values (new.id)
      on conflict (profile_id) do nothing;
    end if;

    return new;
  end;
  $fn$;

  drop trigger if exists trg_profiles_sync_role_tables on public.profiles;
  create trigger trg_profiles_sync_role_tables
  after insert or update of role, agent_badge_id on public.profiles
  for each row execute function public.sync_role_profile_tables();
end $$;

drop policy if exists "driver_profiles_select_self_or_staff" on public.driver_profiles;
create policy "driver_profiles_select_self_or_staff"
on public.driver_profiles for select
to authenticated
using (profile_id = auth.uid() or public.current_role() in ('agent', 'admin'));

do $$
begin
  if to_regclass('public.agent_profiles') is not null then
    execute 'drop policy if exists "agent_profiles_select_self_or_admin" on public.agent_profiles';
    execute $sql$
      create policy "agent_profiles_select_self_or_admin"
      on public.agent_profiles for select
      to authenticated
      using (profile_id = auth.uid() or public.current_role() = 'admin')
    $sql$;
  end if;
end $$;

do $$
begin
  if to_regclass('public.admin_profiles') is not null then
    execute 'drop policy if exists "admin_profiles_select_self_or_admin" on public.admin_profiles';
    execute $sql$
      create policy "admin_profiles_select_self_or_admin"
      on public.admin_profiles for select
      to authenticated
      using (profile_id = auth.uid() or public.current_role() = 'admin')
    $sql$;
  end if;
end $$;

drop policy if exists "role_profile_tables_admin_write_driver" on public.driver_profiles;
create policy "role_profile_tables_admin_write_driver"
on public.driver_profiles for all
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

do $$
begin
  if to_regclass('public.agent_profiles') is not null then
    execute 'drop policy if exists "role_profile_tables_admin_write_agent" on public.agent_profiles';
    execute $sql$
      create policy "role_profile_tables_admin_write_agent"
      on public.agent_profiles for all
      to authenticated
      using (public.current_role() = 'admin')
      with check (public.current_role() = 'admin')
    $sql$;
  end if;
end $$;

do $$
begin
  if to_regclass('public.admin_profiles') is not null then
    execute 'drop policy if exists "role_profile_tables_admin_write_admin" on public.admin_profiles';
    execute $sql$
      create policy "role_profile_tables_admin_write_admin"
      on public.admin_profiles for all
      to authenticated
      using (public.current_role() = 'admin')
      with check (public.current_role() = 'admin')
    $sql$;
  end if;
end $$;

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

