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

## Out of Phase 1

Payments, chats, orders, points, memberships, native app packaging, old Supabase reuse, old user migration, and service role exposure are not allowed.
