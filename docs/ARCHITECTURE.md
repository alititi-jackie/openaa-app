# OpenAA architecture

`openaa-app` is the canonical application for `https://openaa.com`. It uses Next.js App Router, TypeScript, Supabase Auth, Postgres, Storage, and Vercel. The web and PWA share one application; any future mobile wrapper should reuse the same backend.

## Repository map

| Path | Responsibility |
| --- | --- |
| `app/(site)/` | Public pages, accounts, channels, and metadata. The route group does not appear in URLs. |
| `app/admin/` | Admin pages and route-level access gates. |
| `app/api/`, `app/auth/callback/` | HTTP endpoints and Supabase auth callback. |
| `components/` | Shared UI grouped by site area or business domain. |
| `features/` | Business queries, actions, mapping, validation, and types. Posts are shared by jobs, housing, marketplace, and services. |
| `lib/` | Infrastructure: Supabase clients, authorization, configuration, rate limits, SEO, and common validation. |
| `supabase/migrations/` | Ordered database schema and RLS changes. |
| `public/` | Images, icons, and PWA service worker. |
| `tests/` | Unit tests and isolated PostgreSQL permission/analytics integration tests. |
| `tools/archive/` | Historical import data and manually invoked maintenance scripts; excluded from the website runtime. |

Routes use server components for reads, feature actions for writes, and route handlers for HTTP consumers. The public and admin UI share the Supabase schema. Server checks and database policies both enforce authorization; hiding a button is not an authorization rule.

## Content and configuration

The four post channels use `features/posts/` and `components/posts/`. Home, news, navigation, DMV, ads, notifications, accounts, and admin have separate feature and UI modules. Home configuration and top quick links read from Supabase with fallback content for unavailable public data. `app/sitemap.ts`, `app/robots.ts`, and `lib/seo/` own crawl metadata and canonical URLs.

The privileged client in `lib/supabase/admin.ts` is server-only. Never pass a service role credential to browser code. `lib/supabase/database.ts` contains generated schema types; `lib/supabase/types.ts` contains application-facing types. See `lib/supabase/README.md` for regeneration.

## Maintenance

Current setup, environment variables, commands, deployment and known initialization limits
are maintained in the [root README](../README.md). CI runs production dependency audit,
lint, typecheck, unit tests, isolated permission tests, admin audit and build.
Analytics database tests are available separately and are not currently in CI.

Unit tests and builds do not establish live authentication or database behavior.
Permission integration tests use PGlite with actual schema/RLS/trigger definitions;
Auth/Storage service behavior and browser flows still need environment-specific checks.

Put schema changes in new migrations, preserving applied history. The original baseline
has forward foreign-key dependencies and is not a verified one-command initialization
path. Never reset production to apply it; see [migration guidance](../supabase/migrations/README.md).
Historical import tools require explicit parameters and must be reviewed before writes;
see [archive tools](../tools/archive/README.md).
