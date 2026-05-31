# Admin Permissions

The admin system is multi-admin and role-based with permission point overrides.

## Tables

- `admin_roles`
- `admin_permissions`
- `admin_role_permissions`
- `admin_user_permissions`
- `admin_audit_logs`

Phase 2 creates all of these tables and seeds baseline permission keys plus default role mappings.

## Role Defaults

- `super_admin`: implicitly has all permissions through `public.is_super_admin()`.
- `admin`: broad operational access, but not full administrator management by default.
- `editor`: content, news, navigation, home, and DMV viewing permissions.
- `moderator`: users, posts, reports, and feedback handling permissions.
- `support`: simplified feedback/report support role, reserved for later UI enablement.

Single-user permission overrides live in `admin_user_permissions`. `deny` wins over `allow`.

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

## Bootstrap

The first `super_admin` is inserted only after the user signs up normally. See `docs/ADMIN_BOOTSTRAP.md`.
