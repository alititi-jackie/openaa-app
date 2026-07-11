# OpenAA Development Principles

These principles apply to future OpenAA development for `https://openaa.com`.

1. OpenAA has one canonical project repository: `openaa-app`.
2. Do not split OpenAA into separate site generations. Use `OpenAA`, `OpenAA project`, `OpenAA repository`, or `openaa-app`.
3. Product and engineering decisions should be based on the current `openaa-app` codebase, schema, routes, permissions, and deployment rules.
4. When rebuilding or extending a feature, use current shared components, current Supabase schema, current admin roles, feature flags, and the existing App Router structure.
5. Do not copy code from unrelated repositories. Rebuild behavior using the OpenAA project structure.
6. Shared UI such as Header, BottomNav, cards, channel pages, detail pages, forms, filters, back/share controls, empty states, SEO cards, and admin cards must prioritize reusable public components.
7. Before adding or changing UI, search `openaa-app` for existing reusable components and use them when appropriate.
8. Preserve useful OpenAA behavior and admin configurability through the current schema and permission system.
9. Do not write four duplicate implementations just to move faster.
10. Do not introduce temporary ADMIN_TOKEN patterns, scattered query patterns, or compatibility shortcuts that bypass the current permission model.
11. Every PR must state whether it reused shared components, whether it changed permissions or data flow, and whether it introduced repeated logic.
