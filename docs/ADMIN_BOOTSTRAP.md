# Admin Bootstrap

Phase 3 does not use the old `ADMIN_TOKEN` pattern. The first `super_admin` is granted manually in the new Supabase project after the user signs up through normal Supabase Auth.

Confirmed first admin email:

`fengjiancheng8@gmail.com`

## Bootstrap Flow

1. Register normally in the app with `fengjiancheng8@gmail.com`.
2. Confirm the user exists in `auth.users`.
3. Query the matching user id for that email.
4. Insert one active `admin_roles` row with `role = 'super_admin'`.
5. Write a bootstrap note to `admin_audit_logs`.
6. Confirm `/admin/dashboard` shows the active role.

## SQL Template

Use `scripts/bootstrap-super-admin.sql` in the Supabase SQL editor or a server-only migration context. Replace only these placeholders before running:

- `<SUPER_ADMIN_USER_ID>`
- `<SUPER_ADMIN_EMAIL>`

Do not write real service role keys, project URLs, or auth user IDs into the repository.

## Safety Rules

- The service role key is server-only and must never be imported by client components.
- Admin access is checked through `admin_roles` and permission helpers, not `profiles.user_role`.
- Frontend button hiding is not a security boundary.
- Phase 2 created `admin_roles_prevent_last_super_admin_change`, which prevents disabling or demoting the last active `super_admin`.
- Do not connect this app to the old Supabase project or import old users/data during bootstrap.

## Tables

- `admin_roles`
- `admin_permissions`
- `admin_role_permissions`
- `admin_user_permissions`
- `admin_audit_logs`
