# Admin Permissions

The admin system is multi-admin and role-based with permission point overrides.

## Tables

- `admin_roles`
- `admin_permissions`
- `admin_role_permissions`
- `admin_user_permissions`
- `admin_audit_logs`

## Rules

1. User must be logged in.
2. User must have active `admin_roles`.
3. Role permissions are checked.
4. User overrides are checked.
5. `deny` beats `allow`.
6. `super_admin` has all permissions.
7. The last active `super_admin` cannot be disabled or removed.
8. Every admin API/server action must check permissions on the server.
9. Frontend button hiding is not a security boundary.
