# Admin Backend Gap Recheck

This is a read-only recheck of the old `openaa-ny` backend against the new `openaa-app` backend.

Historical note: this document started as an old-backend gap check. Since then, the new admin surface has consolidated several routes:

- Feedback and report support tickets now use `/admin/support`.
- Old standalone reports and notifications admin pages are now under `/admin/messages`:
  - `/admin/messages?tab=reports`
  - `/admin/messages?tab=notifications`
- User-published content is now managed through `/admin/user-posts`.

Do not use the old standalone new-site paths `/admin/feedback`, `/admin/reports`, `/admin/notifications`, or `/admin/posts`; they are historical references only.

Inputs checked:

- `D:\GitHub\openaa-ny\app\admin`
- `D:\GitHub\openaa-ny\app\api\admin`
- `D:\GitHub\openaa-ny\docs\API.md`
- `D:\GitHub\openaa-ny\docs\DATABASE.md`
- `D:\GitHub\openaa-ny\docs\DEPLOYMENT.md`
- `D:\GitHub\openaa-app\app\admin`
- `D:\GitHub\openaa-app\features`
- `D:\GitHub\openaa-app\supabase\migrations`

No old Supabase connection was used. No old data was imported. `openaa-ny` was not modified.

## Summary

The old backend uses `ADMIN_TOKEN` plus service-role API routes. The new backend replaces this with:

- Supabase Auth login
- `admin_roles`
- role permissions
- server actions
- RLS
- `admin_audit_logs`
- `/admin/admins`

The new backend now covers the old backend's core operational modules. Some old capabilities are intentionally represented differently in the new architecture.

`/admin/dmv` is not implemented now and should remain deferred until the full site is complete and DMV admin requirements are confirmed.

## Old Backend Routes

Old `openaa-ny` admin pages found:

- `/admin`
- `/admin/users`
- `/admin/user-posts`
- `/admin/services`
- `/admin/news`
- `/admin/navigation`
- `/admin/top-links`
- `/admin/home-sections`
- `/admin/ads`
- `/admin/feedback`
- `/admin/notifications`
- `/admin/settings`
- `/admin/image-cleanup`

Old admin API groups found:

- `/api/admin/users`
- `/api/admin/posts`
- `/api/admin/services`
- `/api/admin/news`
- `/api/admin/navigation`
- `/api/admin/top-links`
- `/api/admin/home-sections`
- `/api/admin/ads`
- `/api/admin/feedback`
- `/api/admin/notifications`
- `/api/admin/settings`
- `/api/admin/image-cleanup`

Old auth pattern:

- `/api/admin/*` required `x-admin-token: <ADMIN_TOKEN>`
- server used `SUPABASE_SERVICE_ROLE_KEY`

New auth pattern:

- `/admin/*` requires logged-in Supabase Auth user
- active `admin_roles` is required
- server-side permission checks are required
- RLS remains active
- admin writes are audited

## Module Comparison

| Old backend capability | New backend status | Notes |
| --- | --- | --- |
| `/admin` token login | Replaced | New `/admin` uses Supabase Auth + `admin_roles`; no `ADMIN_TOKEN`. |
| dashboard/module entry | Complete | New `/admin/dashboard` lists all backend modules and permission gates. |
| users management | Complete | New `/admin/users` supports user status, internal notes, post counts, and permissions. |
| admin authorization | New app enhancement | Old site did not have role-based admin grant UI; new `/admin/admins` handles this. |
| posts management | Complete | New `/admin/user-posts` handles jobs/housing/marketplace/services in one unified table. Old `secondhand` maps to new `marketplace`. |
| services admin page | Covered by user-posts | Old `/admin/services` is represented by `/admin/user-posts?type=service` in the new architecture. |
| news management | Complete | New `/admin/news` supports news/category operations with permission checks and audit logs. |
| navigation management | Complete | New `/admin/navigation` covers categories, links, featured state, sorting, and active state. |
| top links management | Complete | New `/admin/top-links` covers header quick links. |
| home sections | Complete | New `/admin/home` covers home sections, banners, ticker, and home operations. |
| ads management | Complete with new model | New `/admin/ads` manages placements and external image assets. Old upload/delete image behavior is intentionally not copied one-to-one. |
| feedback management | Complete | Current new-site route is `/admin/support`; old standalone `/admin/feedback` and old `/admin/messages?tab=feedback` references are historical only. |
| reports management | New app enhancement | Current new-site route is `/admin/messages?tab=reports`; old standalone `/admin/reports` references are historical only. |
| notifications management | Complete | Current new-site route is `/admin/messages?tab=notifications`; old standalone `/admin/notifications` references are historical only. |
| settings | Complete | New `/admin/settings` covers site settings such as daily post limit. |
| image cleanup | Complete with safer behavior | New `/admin/image-cleanup` soft-marks records instead of physical deletion. |
| audit logs | New app enhancement | New `/admin/audit-logs` covers backend traceability. |
| DMV admin | Deferred | No current PR. Wait until full site is complete and DMV admin scope is confirmed. |

## Remaining Gaps Or Intentional Differences

### P0

No P0 old-backend gaps remain in the checked admin surface.

### P1

No immediate P1 backend page is required before continuing, assuming `/admin/dmv` remains deferred.

### P2

- Richer ads media management could be revisited later if product wants upload/delete parity with the old backend.
- News cover upload can be revisited later if product wants direct upload parity rather than current image asset/external URL handling.
- More granular admin permission override UI could be added later. Current `/admin/admins` manages roles and active state, while role permission tables remain seeded by migration.

### Deferred

- `/admin/dmv`
- production data import controls
- destructive storage cleanup
- direct backend user auth/provider management

## Safety Findings

- New backend no longer uses old `ADMIN_TOKEN`.
- New backend checks admin permissions server-side.
- New backend pages are `noindex`.
- New backend dashboard covers all existing `/admin/*` route directories.
- `npm run audit:admin` can repeat these checks.
- Service role usage is limited to approved server-side admin report files and `lib/supabase/admin.ts`.

## Recommended Next Backend Step

Do not start `/admin/dmv` yet.

Recommended next action:

1. Use `docs/ADMIN_ONLINE_AUTHORIZATION.md` to configure the first real production/staging `super_admin`.
2. Test `/admin/admins` with that real admin.
3. Confirm audit logs are written for grant/change/disable/restore.
4. Run:

```bash
npm run audit:admin
npm run lint
npm run typecheck
npm run build
```

After that, backend can be considered stable enough to pause while the remaining front-site work continues.
