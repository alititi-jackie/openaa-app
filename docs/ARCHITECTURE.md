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
| `tests/` | Unit checks and space for isolated database integration checks. |
| `tools/archive/` | Historical import data and manually invoked maintenance scripts; excluded from the website runtime. |

Routes use server components for reads, feature actions for writes, and route handlers for HTTP consumers. The public and admin UI share the Supabase schema. Server checks and database policies both enforce authorization; hiding a button is not an authorization rule.

## Content and configuration

The four post channels use `features/posts/` and `components/posts/`. Home, news, navigation, DMV, ads, notifications, accounts, and admin have separate feature and UI modules. Home configuration and top quick links read from Supabase with fallback content for unavailable public data. `app/sitemap.ts`, `app/robots.ts`, and `lib/seo/` own crawl metadata and canonical URLs.

The privileged client in `lib/supabase/admin.ts` is server-only. Never pass a service role credential to browser code. `lib/supabase/database.ts` contains generated schema types; `lib/supabase/types.ts` contains application-facing types. See `lib/supabase/README.md` for regeneration.

## Maintenance

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run audit:admin`, and `npm run build` for a full local check. CI runs the same checks on pull requests and main. Unit tests do not exercise live database policies; verify RLS against an isolated database before changing permissions.

Put schema changes in new numbered migrations. Historical import scripts require explicit parameters and must be reviewed before any database apply. See `tools/archive/README.md`.
