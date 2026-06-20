# openaa-app

OpenAA APP core for `openaa.com`: a mobile-first Web/PWA platform that will later support Android TWA, Capacitor, or iOS WebView wrappers without replacing the core business system.

## Phase 1

- Next.js App Router, TypeScript, Tailwind CSS, ESLint.
- Mobile-first AppShell with Header, BottomNav, safe-area spacing, and placeholder public/auth/admin routes.
- PWA shell with manifest, icons, install/update/offline placeholders.
- Domain-aware SEO config with `https://openaa.com` as the canonical primary domain.
- Legal page templates for privacy, terms, community guidelines, and contact.

## Guardrails

- Do not modify `openaa-ny`.
- Do not connect to or reuse the old Supabase project.
- Do not expose service role keys to the frontend.
- Payment, chat, orders, points, memberships, and native app packaging are out of Phase 1.
