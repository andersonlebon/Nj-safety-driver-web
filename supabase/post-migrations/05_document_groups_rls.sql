-- RLS for document_groups and updated attachment access.

drop trigger if exists trg_document_groups_updated_at on public.document_groups;
create trigger trg_document_groups_updated_at
before update on public.document_groups
for each row execute function public.set_updated_at();

alter table public.document_groups enable row level security;

drop policy if exists "document_groups_select" on public.document_groups;
create policy "document_groups_select"
on public.document_groups for select
to authenticated
using (
  owner_id = auth.uid()
  or public.current_role() in ('agent', 'admin')
);

drop policy if exists "document_groups_insert_owner" on public.document_groups;
create policy "document_groups_insert_owner"
on public.document_groups for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "document_groups_update_owner_or_staff" on public.document_groups;
create policy "document_groups_update_owner_or_staff"
on public.document_groups for update
to authenticated
using (
  owner_id = auth.uid()
  or public.current_role() in ('agent', 'admin')
)
with check (
  owner_id = auth.uid()
  or public.current_role() in ('agent', 'admin')
);

drop policy if exists "document_groups_delete_owner_or_admin" on public.document_groups;
create policy "document_groups_delete_owner_or_admin"
on public.document_groups for delete
to authenticated
using (
  owner_id = auth.uid()
  or public.current_role() = 'admin'
);
