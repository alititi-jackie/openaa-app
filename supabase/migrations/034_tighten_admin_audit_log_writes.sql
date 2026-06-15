drop policy if exists "Admins can insert audit logs"
  on public.admin_audit_logs;

-- Audit log writes must go through trusted server-side code using the service
-- role client. Authenticated users, including admins and super_admins, should
-- not be able to forge audit rows from a regular client session.
