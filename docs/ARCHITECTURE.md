# OpenAA Architecture

`openaa-app` is the new OpenAA platform core for `openaa.app`. It is separate from `openaa-ny` and will use a new GitHub repository, new Supabase project, new database schema, new Auth, new Storage, new API, and new admin system.

## Phase 1 Scope

- Next.js App Router, TypeScript, Tailwind CSS.
- Mobile-first AppShell with a centered desktop phone-width container.
- PWA shell, legal pages, static sitemap, robots, and domain-aware SEO config.
- Placeholder routes only; no business data and no Supabase connection.

## Platform Direction

- Web, PWA, and future Android/iOS wrappers share one business system.
- Supabase Auth, database, Storage, API, admin, permissions, moderation, and content all remain shared.
- Do not build separate native-only business logic unless a future wrapper requires a small integration bridge.

## Top Quick Links

The global header includes a New York city entry and an expandable horizontal quick navigation bar. The current frontend uses `fallbackTopQuickLinks` so the app shell works without Supabase environment variables.

Future admin configuration should use the `top_quick_links` table shape: `id`, `title`, `url`, `open_mode`, `sort_order`, `is_active`, `city_id`, and optional `icon`. Runtime reads should filter `is_active = true`, scope to the default New York city, sort by `sort_order`, and support `open_mode` values of `same` and `new`.

Do not import old `openaa-ny` data. The old project is only a visual and product reference.

## Out of Phase 1

Payments, chats, orders, points, memberships, native app packaging, old Supabase reuse, old user migration, and service role exposure are not allowed.
