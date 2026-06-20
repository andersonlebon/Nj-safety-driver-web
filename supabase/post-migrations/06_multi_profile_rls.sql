-- Legacy unified single-profile RLS (profile_types model).
-- Superseded by 0014_staff_profile_model.sql + 07_staff_profile_rls.sql.
-- No-op once the staff profile model is active.

select 1
where to_regclass('public.staff_profiles') is null
  and false;
