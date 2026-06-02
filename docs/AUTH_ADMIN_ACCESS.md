# Auth admin access

This project does not force-merge Supabase Auth users in application code. Google same-email behavior should be verified in staging against the configured Supabase Auth providers.

## Grant admin access

Do not grant admin access by email alone.

Use `docs/ADMIN_ONLINE_AUTHORIZATION.md`:

1. Search and confirm the real Supabase Auth user.
2. Confirm the matching `profiles.id`.
3. Grant by confirmed user id.
4. Use `/admin/admins` for later grants, role changes, disable, and restore operations.

The `/admin` area checks `admin_roles.is_active` and the seeded permission mapping. Do not commit Supabase keys or run this against the old Supabase project.

## Google same-email staging test

1. Register with email/password and confirm the email.
2. Sign in with Google using the same email address.
3. Confirm `auth.users` uses the same user id.
4. Confirm `auth.identities` contains both `email` and `google` identities for that user.
5. If Supabase creates duplicate users, handle account linking in a later dedicated PR.
