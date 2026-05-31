-- One-time template for bootstrapping the first OpenAA super_admin.
-- Replace placeholders before running in the NEW Supabase project only.
-- Do not commit real user IDs, service role keys, or project credentials.

begin;

insert into public.admin_roles (
  user_id,
  role,
  is_active,
  granted_by,
  note
)
values (
  '<SUPER_ADMIN_USER_ID>'::uuid,
  'super_admin',
  true,
  null,
  'Initial manual super_admin bootstrap for <SUPER_ADMIN_EMAIL>'
)
on conflict (user_id) do update
set
  role = 'super_admin',
  is_active = true,
  revoked_by = null,
  revoked_at = null,
  note = excluded.note,
  updated_at = now();

insert into public.admin_audit_logs (
  actor_id,
  action,
  entity_type,
  entity_id,
  after_data
)
values (
  '<SUPER_ADMIN_USER_ID>'::uuid,
  'bootstrap_super_admin',
  'admin_roles',
  '<SUPER_ADMIN_USER_ID>',
  jsonb_build_object(
    'email', '<SUPER_ADMIN_EMAIL>',
    'role', 'super_admin',
    'source', 'manual_bootstrap'
  )
);

commit;
