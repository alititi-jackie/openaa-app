# Auth admin access

This project does not force-merge Supabase Auth users in application code. Google same-email behavior should be verified in staging against the configured Supabase Auth providers.

## Grant admin access by email

Run this in the new Supabase project's SQL Editor. Replace `<ADMIN_EMAIL>` and choose an allowed role such as `admin`, `moderator`, `editor`, `support`, or `super_admin`.

```sql
with target_user as (
  select u.id, u.email, u.email_confirmed_at
  from auth.users u
  where lower(u.email) = lower('<ADMIN_EMAIL>')
  limit 1
),
ensure_profile as (
  insert into public.profiles (id, email, email_verified, updated_at)
  select id, email, email_confirmed_at is not null, now()
  from target_user
  on conflict (id) do update
  set email = excluded.email,
      email_verified = excluded.email_verified,
      updated_at = now()
  returning id
)
insert into public.admin_roles (user_id, role, is_active, note, updated_at)
select id, 'admin'::public.admin_role, true, 'Granted via Supabase SQL Editor', now()
from target_user
on conflict (user_id) do update
set role = excluded.role,
    is_active = true,
    revoked_at = null,
    revoked_by = null,
    note = excluded.note,
    updated_at = now();
```

The `/admin` area still checks `admin_roles.is_active` and the seeded permission mapping. Do not commit Supabase keys or run this against the old Supabase project.

## Google same-email staging test

1. Register with email/password and confirm the email.
2. Sign in with Google using the same email address.
3. Confirm `auth.users` uses the same user id.
4. Confirm `auth.identities` contains both `email` and `google` identities for that user.
5. If Supabase creates duplicate users, handle account linking in a later dedicated PR.
