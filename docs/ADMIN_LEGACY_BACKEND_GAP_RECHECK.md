# Admin Backend Gap Recheck

This is a read-only historical backend comparison between an external reference implementation (`openaa-ny` at the time of review) and the current OpenAA backend in `openaa-app`.

Historical note: this document started as a backend gap check against that external reference implementation. Since then, the current admin surface has consolidated several routes:

- Feedback and report support tickets now use `/admin/support`.
- Standalone reports and notifications admin pages are now under `/admin/messages`:
  - `/admin/messages?tab=reports`
  - `/admin/messages?tab=notifications`
- User-published content is now managed through `/admin/user-posts`.

Do not use the unused standalone paths `/admin/feedback`, `/admin/reports`, `/admin/notifications`, or `/admin/posts`; they are historical references only.

Inputs checked:

- `D:\GitHub\openaa-ny\app\admin`
- `D:\GitHub\openaa-ny\app\api\admin`
- `D:\GitHub\openaa-ny\docs\API.md`
- `D:\GitHub\openaa-ny\docs\DATABASE.md`
- `D:\GitHub\openaa-ny\docs\DEPLOYMENT.md`
- `D:\GitHub\openaa-app\app\admin`
- `D:\GitHub\openaa-app\features`
- `D:\GitHub\openaa-app\supabase\migrations`

The `openaa-ny` paths above are provenance paths from the historical comparison only. They must not be interpreted as a current or retired OpenAA repository.

No source Supabase connection was used. No source data was imported. `openaa-ny` was not modified.

## Summary

The reference backend used `ADMIN_TOKEN` plus service-role API routes. The current OpenAA backend replaces this with:

- Supabase Auth login
- `admin_roles`
- role permissions
- server actions
- RLS
- `admin_audit_logs`
- `/admin/admins`

The current OpenAA backend now covers the checked core operational modules. Some reference capabilities are intentionally represented differently in the current architecture.

`/admin/dmv` is not implemented now and should remain deferred until the full site is complete and DMV admin requirements are confirmed.

## Reference Backend Routes

Reference admin pages found:

- `/admin`
- `/admin/users`
- `/admin/user-posts`
- `/admin/services`
- `/admin/news`
- `/admin/navigation`
- top links page
- `/admin/home-sections`
- `/admin/ads`
- `/admin/feedback`
- `/admin/notifications`
- `/admin/settings`
- `/admin/recycle-bin?tab=image-cleanup`

Reference admin API groups found:

- `/api/admin/users`
- `/api/admin/posts`
- `/api/admin/services`
- `/api/admin/news`
- `/api/admin/navigation`
- top links admin API group
- `/api/admin/home-sections`
- `/api/admin/ads`
- `/api/admin/feedback`
- `/api/admin/notifications`
- `/api/admin/settings`
- image cleanup admin API group

Reference auth pattern:

- `/api/admin/*` required `x-admin-token: <ADMIN_TOKEN>`
- server used `SUPABASE_SERVICE_ROLE_KEY`

Current OpenAA auth pattern:

- `/admin/*` requires logged-in Supabase Auth user
- active `admin_roles` is required
- server-side permission checks are required
- RLS remains active
- admin writes are audited

## Module Comparison

| Reference backend capability | Current OpenAA backend status | Notes |
| --- | --- | --- |
| `/admin` token login | Replaced | Current `/admin` uses Supabase Auth + `admin_roles`; no `ADMIN_TOKEN`. |
| dashboard/module entry | Complete | Current `/admin/dashboard` lists all backend modules and permission gates. |
| users management | Complete | Current `/admin/users` supports user status, internal notes, post counts, and permissions. |
| admin authorization | Current OpenAA enhancement | The reference implementation did not have role-based admin grant UI; current `/admin/admins` handles this. |
| posts management | Complete | Current `/admin/user-posts` handles jobs/housing/marketplace/services in one unified table. Marketplace uses `marketplace` as its canonical module and route name. |
| services admin page | Covered by user-posts | Reference `/admin/services` is represented by `/admin/user-posts?type=service` in the current architecture. |
| news management | Complete | Current `/admin/news` supports news/category operations with permission checks and audit logs. |
| navigation management | Complete | Current `/admin/navigation` covers categories, links, featured state, sorting, and active state. |
| top links management | Complete | Current `/admin/navigation?tab=top-links` covers header quick links. |
| home sections | Complete | Current `/admin/home` covers home sections, banners, ticker, and home operations. |
| ads management | Complete with current model | Current `/admin/ads` manages placements and external image assets. Reference upload/delete image behavior is intentionally not copied one-to-one. |
| feedback management | Complete | Current route is `/admin/support`; standalone `/admin/feedback` and `/admin/messages?tab=feedback` references are historical only. |
| reports management | Current OpenAA enhancement | Current route is `/admin/messages?tab=reports`; standalone `/admin/reports` references are historical only. |
| notifications management | Complete | Current route is `/admin/messages?tab=notifications`; standalone `/admin/notifications` references are historical only. |
| settings | Complete | Current `/admin/settings` covers site settings such as daily post limit. |
| image cleanup | Complete with safer behavior | Current `/admin/recycle-bin?tab=image-cleanup` soft-marks records instead of physical deletion. |
| audit logs | Current OpenAA enhancement | Current `/admin/audit-logs` covers backend traceability. |
| DMV admin | Deferred | No current PR. Wait until full site is complete and DMV admin scope is confirmed. |

## Remaining Gaps Or Intentional Differences

### P0

No P0 reference-backend gaps remain in the checked admin surface.

### P1

No immediate P1 backend page is required before continuing, assuming `/admin/dmv` remains deferred.

### P2

- Richer ads media management could be revisited later if product wants upload/delete parity with the reference backend.
- News cover upload can be revisited later if product wants direct upload parity rather than current image asset/external URL handling.
- More granular admin permission override UI could be added later. Current `/admin/admins` manages roles and active state, while role permission tables remain seeded by migration.

### Deferred

- `/admin/dmv`
- production data import controls
- destructive storage cleanup
- direct backend user auth/provider management

## Safety Findings

- Current OpenAA backend no longer uses `ADMIN_TOKEN`.
- Current OpenAA backend checks admin permissions server-side.
- Current OpenAA backend pages are `noindex`.
- Current OpenAA backend dashboard covers all existing `/admin/*` route directories.
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

After that, backend can be considered stable enough to pause while the remaining public-site work continues.
