-- Approved staff agents and admins should show verification_status = active.
UPDATE public.profiles AS p
SET verification_status = 'active',
    updated_at = now()
FROM public.staff_profiles AS sp
WHERE sp.profile_id = p.id
  AND p.role = 'staff'
  AND p.verification_status = 'pending_review'
  AND (
    sp.staff_role = 'admin'
    OR sp.application_status = 'approved'
  );
