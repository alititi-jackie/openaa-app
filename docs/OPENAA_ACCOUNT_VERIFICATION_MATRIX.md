# OpenAA Account Verification Matrix

Date: 2026-06-04

This matrix is for real Supabase/Auth/Vercel verification after the permission, route, API, image host, and contact reveal fixes. Static checks cannot prove these cases without real test accounts and a deployed Supabase project.

## Test Accounts Needed

- Anonymous visitor: no session.
- Active user: `profiles.status = active`.
- Restricted user: `profiles.status = restricted`.
- Banned user: `profiles.status = banned`.
- Non-admin user: active profile, no active `admin_roles` row.
- Admin user: active profile with active `admin_roles` row and relevant permissions.

## Matrix

| Area | Anonymous | Active user | Restricted user | Banned user | Non-admin | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Public pages | Can view published active-author content | Can view published active-author content | Can view published active-author content | Can view published active-author content | Can view published active-author content | Can view published active-author content |
| Restricted/banned authored content | Must be hidden | Must be hidden | Own public content must be hidden from public feed | Own public content must be hidden from public feed | Must be hidden | Admin may see in backend only |
| Publish pages | Redirects to auth required | Can open and submit | Can open, submit must fail | Can open, submit must fail | Can open and submit if active | Can open and submit if active |
| Edit own content | Cannot access | Can edit eligible own content | Can edit eligible old own content, cannot restore | Cannot edit | Can edit eligible own content | Can edit own content and moderate via backend |
| Hide/restore own content | Cannot access | Can hide and restore eligible own content | Cannot hide/restore public content | Cannot hide/restore | Can hide/restore eligible own content | Can moderate via backend |
| Delete own content | Cannot access | Can soft-delete eligible own content | Can soft-delete eligible old own content | Cannot delete | Can soft-delete eligible own content | Can moderate via backend |
| Favorites | API returns 401 | Can read own favorites only | Can read own favorites only | Can read own favorites only unless product policy blocks login | Can read own favorites only | Can read own favorites only |
| Admin pages | Shows unauthenticated gate | Shows forbidden gate | Shows forbidden gate unless admin role exists | Shows forbidden gate unless admin role exists | Shows forbidden gate | Can access allowed modules |
| Admin API probe | `/api/admin` returns 401 | returns 403 | returns 403 unless admin role exists | returns 403 unless admin role exists | returns 403 | returns 200 |
| Contact reveal | Can reveal contacts only for public active-author posts | Same | Same | Same | Same | Same |
| Image display | Supabase storage and `img.openaa.com` images render | Same | Same | Same | Same | Same |

## Route Checks

- `/secondhand` redirects to `/marketplace`.
- `/secondhand/[id]` redirects to `/marketplace/[id]`.
- `/secondhand/publish` redirects to `/marketplace/publish` after auth check.
- `/dmv/ny/practice` redirects to `/dmv/practice`.
- `/dmv/ny/questions` redirects to `/dmv/questions`.
- `/dmv/ny/mock-test` redirects to `/dmv/mock-test`.
- `/dmv/ny/sign-test` redirects to `/dmv/sign-test`.
- `/auth/login` redirects to `/login`.
- `/auth/register` redirects to `/register`.
- `/auth/reset-password` redirects to `/reset-password`.
- `/auth/callback` exchanges Supabase auth code and redirects to a safe return target.

## API Checks

- `GET /api/jobs`
- `GET /api/housing`
- `GET /api/secondhand`
- `GET /api/services`
- `GET /api/search?q=...`
- `GET /api/ads`
- `GET /api/favorites`
- `GET /api/auth/session`
- `GET /api/admin`
- `GET /api/posts/[id]/contact`

## Current Status

Static implementation is complete for the matrix entry points above. Real account execution remains unable to confirm until test credentials and a real Supabase environment are available.
