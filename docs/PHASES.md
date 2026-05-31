# Phases

## Phase 1

Initialize the clean Next.js project, AppShell, PWA shell, legal pages, domain SEO strategy, placeholders, and documentation.

Acceptance:

- `npm install` works.
- `npm run lint` works.
- `npm run build` works.
- Main placeholder routes render.
- No dependency on real Supabase keys.

## Phase 2

Add the first Supabase migrations: cities, profiles, admin permission tables, feature flags, image assets, posts core, DMV tables, legal consent tables, and explicit RLS policies.

## Phase 3

Add Supabase Auth, profiles, first `super_admin` bootstrap, admin role checks, and admin login.

## Later Phases

Home, posts, images, user center, news, navigation, ads, DMV, admin management, SEO hardening, PWA caching, and production deployment follow after the schema and auth foundation.
