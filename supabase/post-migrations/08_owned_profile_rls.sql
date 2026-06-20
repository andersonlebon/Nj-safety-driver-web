-- RLS for owned resources after the staff profile model.
-- profiles.id is no longer auth.uid(); owner_id / driver_id reference profile rows
-- owned via profiles.user_id. Storage paths still use auth.uid() as the first folder.

-- ── vehicles ──────────────────────────────────────────────────────────────────
drop policy if exists "vehicles_select" on public.vehicles;
create policy "vehicles_select"
on public.vehicles for select
to authenticated
using (
  owner_id in (select public.user_profile_ids())
  or public.is_staff()
);

drop policy if exists "vehicles_insert_owner" on public.vehicles;
create policy "vehicles_insert_owner"
on public.vehicles for insert
to authenticated
with check (
  owner_id in (select public.user_profile_ids())
  or public.has_staff_role('admin')
);

drop policy if exists "vehicles_update_owner_or_admin" on public.vehicles;
create policy "vehicles_update_owner_or_admin"
on public.vehicles for update
to authenticated
using (
  owner_id in (select public.user_profile_ids())
  or public.has_staff_role('admin')
)
with check (
  owner_id in (select public.user_profile_ids())
  or public.has_staff_role('admin')
);

drop policy if exists "vehicles_delete_owner_or_admin" on public.vehicles;
create policy "vehicles_delete_owner_or_admin"
on public.vehicles for delete
to authenticated
using (
  owner_id in (select public.user_profile_ids())
  or public.has_staff_role('admin')
);

-- ── documents ─────────────────────────────────────────────────────────────────
drop policy if exists "documents_select" on public.documents;
create policy "documents_select"
on public.documents for select
to authenticated
using (
  owner_id in (select public.user_profile_ids())
  or public.is_staff()
);

drop policy if exists "documents_insert_owner" on public.documents;
create policy "documents_insert_owner"
on public.documents for insert
to authenticated
with check (
  owner_id in (select public.user_profile_ids())
  or public.has_staff_role('admin')
);

drop policy if exists "documents_delete_owner_or_admin" on public.documents;
create policy "documents_delete_owner_or_admin"
on public.documents for delete
to authenticated
using (
  owner_id in (select public.user_profile_ids())
  or public.has_staff_role('admin')
);

-- ── document_groups ───────────────────────────────────────────────────────────
drop policy if exists "document_groups_select" on public.document_groups;
create policy "document_groups_select"
on public.document_groups for select
to authenticated
using (
  owner_id in (select public.user_profile_ids())
  or public.is_staff()
);

drop policy if exists "document_groups_insert_owner" on public.document_groups;
create policy "document_groups_insert_owner"
on public.document_groups for insert
to authenticated
with check (owner_id in (select public.user_profile_ids()));

drop policy if exists "document_groups_update_owner_or_staff" on public.document_groups;
create policy "document_groups_update_owner_or_staff"
on public.document_groups for update
to authenticated
using (
  owner_id in (select public.user_profile_ids())
  or public.is_staff()
)
with check (
  owner_id in (select public.user_profile_ids())
  or public.is_staff()
);

drop policy if exists "document_groups_delete_owner_or_admin" on public.document_groups;
create policy "document_groups_delete_owner_or_admin"
on public.document_groups for delete
to authenticated
using (
  owner_id in (select public.user_profile_ids())
  or public.has_staff_role('admin')
);

-- ── infractions (driver_id references profiles.id) ────────────────────────────
drop policy if exists "infractions_select" on public.infractions;
create policy "infractions_select"
on public.infractions for select
to authenticated
using (
  driver_id in (select public.user_profile_ids())
  or public.is_staff()
);

-- ── storage.documents ─────────────────────────────────────────────────────────
-- Uploads use auth.uid() as the first path segment; legacy rows may use profile id.
drop policy if exists "docs_select_owner_or_staff" on storage.objects;
create policy "docs_select_owner_or_staff"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (storage.foldername(name))[1]::uuid in (select public.user_profile_ids())
    or public.is_staff()
  )
);

drop policy if exists "docs_insert_owner" on storage.objects;
create policy "docs_insert_owner"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "docs_delete_owner_or_admin" on storage.objects;
create policy "docs_delete_owner_or_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (storage.foldername(name))[1]::uuid in (select public.user_profile_ids())
    or public.has_staff_role('admin')
  )
);
