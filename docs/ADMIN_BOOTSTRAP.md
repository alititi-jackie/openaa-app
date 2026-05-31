# Admin Bootstrap

The first `super_admin` is not inserted in Phase 2.

Confirmed first admin email:

`fengjiancheng8@gmail.com`

## Bootstrap Flow

1. User registers normally through Supabase Auth.
2. Confirm the user exists in `auth.users` and `profiles`.
3. Run a one-time server-only bootstrap script or SQL statement in the new Supabase project to insert into `admin_roles` with `role = 'super_admin'`.
4. Disable or delete the bootstrap path immediately after success.
5. Never keep a long-term `ADMIN_TOKEN` login system.

## Safety Rules

- Do not disable or remove the last active `super_admin`.
- `admin` cannot create or manage `super_admin`.
- Permission checks must run on the server.
- Admin changes must write to `admin_audit_logs`.

## Tables

- `admin_roles`
- `admin_permissions`
- `admin_role_permissions`
- `admin_user_permissions`
- `admin_audit_logs`
