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
- `moderator`: users, posts, and content report handling permissions.
- `support`: support ticket handling permissions for `/admin/support`.

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

## Phase 10 Home Configuration

Phase 10 adds the first home-configuration admin UI:

- `/admin/home`
- `/admin/top-links`

Permission points:

- `manage_home_sections`: update `home_sections` and `home_banners`.
- `manage_top_links`: create, edit, sort, and disable `top_quick_links`.
- `manage_latest_ticker`: create and edit `latest_ticker`.
- `manage_ads`: reserved for a broader ads screen; Phase 10 does not implement full ads CRUD.

Every server action checks the relevant permission before writing and inserts an `admin_audit_logs` row. The UI may hide sections for admins without permissions, but permission checks in server actions are the security boundary.

The implementation preserves old-site homepage configuration capabilities in the new schema and does not use `ADMIN_TOKEN`, old Supabase, or old data imports.

## Support Tickets

The feedback and report support workflow uses:

- `view_support_tickets`: read support tickets, submitter profile contact fields needed for handling, and support ticket settings.
- `handle_support_tickets`: update support ticket status, priority, public reply, internal note, handling timestamps, and support ticket settings.

Support ticket admin writes insert `admin_audit_logs`. Ticket creation and ticket field changes also write `support_ticket_events`.

## Phase 2 Static Review Notes

- `admin_roles` insert/update policies prevent non-`super_admin` admins from creating or modifying `super_admin` rows.
- `admin_roles_prevent_last_super_admin_change` prevents disabling or demoting the final active `super_admin`.
- `post_contacts` keeps contact reads behind `view_post_contacts`; moderation permissions can insert/update/delete contact records but do not implicitly grant select access.

## Bootstrap

The first `super_admin` is inserted only after the user signs up normally. See `docs/ADMIN_BOOTSTRAP.md`.
