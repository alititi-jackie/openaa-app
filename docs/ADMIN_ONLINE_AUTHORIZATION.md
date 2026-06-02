# Admin Online Authorization Runbook

This runbook describes how to grant and manage admin access in the new `openaa-app` stack.

The new app must not use the old `ADMIN_TOKEN` pattern. Admin access is based on:

- Supabase Auth users
- `public.profiles`
- `public.admin_roles`
- seeded role permissions
- `/admin/admins`
- server-side permission checks
- `admin_audit_logs`

Do not connect to the old Supabase project. Do not commit keys or real user ids to GitHub.

## Before You Start

Confirm these are true:

1. The target environment is the new Supabase project for `openaa-app`.
2. The user has already registered or signed in normally.
3. The user exists in Supabase Auth.
4. The user has a matching `public.profiles.id`.
5. You know which role should be granted.

Allowed roles:

- `support`
- `moderator`
- `editor`
- `admin`
- `super_admin`

Only grant `super_admin` after explicit owner confirmation.

## Preferred Flow After First Super Admin Exists

Use the app UI:

1. Sign in as an active admin.
2. Open `/admin/admins`.
3. Confirm the top panel shows your current role and allowed actions.
4. Search for the real user by email, nickname, or user id.
5. Confirm the displayed user id, email, nickname, and account status.
6. Choose the role.
7. Add an internal note.
8. Type `CONFIRM`.
9. Submit the authorization.
10. Confirm the user appears in the admin list.
11. Check `/admin/audit-logs` for the corresponding admin role audit entry.

The UI intentionally does not allow writing a new admin role from email alone. It first searches `profiles`, shows the existing user id, and submits that confirmed user id.

## Required Confirmations

All sensitive admin role operations require a second confirmation by typing `CONFIRM`:

- grant an admin role
- grant `admin` or `super_admin`
- change an admin role
- disable an admin
- restore an admin

Unavailable operations are disabled in the UI and show the reason.

The page top must show:

- current logged-in admin role
- allowed operations
- unavailable operations
- disabled reasons

Frontend button hiding is not a security boundary. Server actions and RLS remain the security boundary.

## First Super Admin Bootstrap

The first `super_admin` cannot be granted from `/admin/admins`, because no admin exists yet. Use the new Supabase SQL Editor for this one-time bootstrap only.

Do this in two separate steps. Do not use a single email-input SQL statement that writes immediately.

### Step 1: Find and Confirm the Real User

Replace `<ADMIN_EMAIL>` only in this read-only query:

```sql
select
  u.id as auth_user_id,
  u.email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.email as profile_email,
  p.nickname,
  p.status
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('<ADMIN_EMAIL>')
order by u.created_at desc;
```

Confirm:

- exactly one intended user is returned
- `auth_user_id` is correct
- `profile_id` matches `auth_user_id`
- the email is the expected email
- the account is not the old Supabase project

If no `profiles` row exists, let the user sign in once, or create the profile using the normal app profile flow. Do not create a dirty admin row for a non-existent profile.

### Step 2: Insert by Confirmed User ID

Only after Step 1 is confirmed, replace `<CONFIRMED_AUTH_USER_ID>`:

```sql
insert into public.admin_roles (
  user_id,
  role,
  is_active,
  note,
  granted_at,
  updated_at
)
values (
  '<CONFIRMED_AUTH_USER_ID>'::uuid,
  'super_admin'::public.admin_role,
  true,
  'Bootstrap first super_admin after confirming auth.users and profiles',
  now(),
  now()
)
on conflict (user_id) do update
set role = excluded.role,
    is_active = true,
    revoked_at = null,
    revoked_by = null,
    note = excluded.note,
    updated_at = now();
```

Then write an audit note:

```sql
insert into public.admin_audit_logs (
  actor_id,
  action,
  entity_type,
  entity_id,
  before_data,
  after_data
)
values (
  '<CONFIRMED_AUTH_USER_ID>'::uuid,
  'bootstrap_super_admin',
  'admin_roles',
  '<CONFIRMED_AUTH_USER_ID>',
  null,
  jsonb_build_object(
    'role', 'super_admin',
    'source', 'manual_supabase_sql_editor',
    'confirmed_user_id', '<CONFIRMED_AUTH_USER_ID>'
  )
);
```

Finally:

1. Sign in as that user.
2. Open `/admin/dashboard`.
3. Open `/admin/admins`.
4. Confirm the current role is `super_admin`.
5. Use `/admin/admins` for every later admin grant or role change.

## Supabase And Vercel Configuration

Supabase Auth should be configured for the new app domain:

- Site URL: `https://openaa.app`
- Redirect URLs:
  - `https://openaa.app/**`
  - `http://localhost:3000/**`

Vercel environment variables must point to the new Supabase project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_PRIMARY_SEO_URL`
- `NEXT_PUBLIC_CANONICAL_URL`
- `NEXT_PUBLIC_APP_ENV`

Never use old Supabase keys. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Safety Checklist

- Do not use `ADMIN_TOKEN`.
- Do not write admin roles by email alone.
- Always confirm the real user id first.
- Always use `/admin/admins` after the first `super_admin` exists.
- Always require `CONFIRM` for sensitive changes.
- Do not disable or demote the last active `super_admin`.
- Check `/admin/audit-logs` after changes.
- Do not connect to old Supabase.
- Do not commit real keys, project ids, or user ids.
