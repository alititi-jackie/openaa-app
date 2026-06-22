# openaa-app

OpenAA APP core for `openaa.com`: a mobile-first Web/PWA platform that will later support Android TWA, Capacitor, or iOS WebView wrappers without replacing the core business system.

## Current Scope

- Next.js App Router, TypeScript, Tailwind CSS, ESLint.
- Mobile-first public site with jobs, housing, marketplace, local services, news, DMV, navigation, search, favorites, profiles, reports, feedback, ads, and PWA shell.
- Admin console for users, user posts, news, ads, messages, navigation, recycle bin, image cleanup, settings, audit logs, and administrator access.
- Clean Supabase launch baseline in `supabase/migrations/001-003`, with generated database types in `lib/supabase/database.ts`.
- Domain-aware SEO config with `https://openaa.com` as the canonical primary domain.

## Guardrails

- Do not modify `openaa-ny`.
- Do not connect to or reuse the old Supabase project.
- Do not expose service role keys to the frontend.
- Payment, chat, orders, points, memberships, and native app packaging are outside the launch baseline.
