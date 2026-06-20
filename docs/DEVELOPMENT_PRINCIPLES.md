# OpenAA Development Principles

These principles apply to future openaa.com development. They are intended to keep the new project aligned with the proven ny.openaa.com experience while preserving the new architecture and code quality.

1. openaa.com is a new-architecture project, not a copy of the openaa-ny codebase.
2. The old ny.openaa.com site is a read-only reference for functionality, visual behavior, and interaction patterns.
3. Features that exist on the old site must be preserved in the new site; the new site may add more, but should not have less.
4. When the user has not requested a new visual direction, pages and modules should default to the old site's display behavior.
5. When the user requests a new visual direction, follow the new requirement while ensuring the overall experience does not fall below the old site.
6. The current openaa.com desktop responsive content width has been confirmed as better; future changes should not regress it back to the old site's narrower width.
7. Do not copy old-site code. Rebuild behavior using the new project structure.
8. Shared UI such as Header, BottomNav, cards, channel pages, detail pages, forms, filters, back/share controls, empty states, SEO cards, and admin cards must prioritize reusable public components.
9. Before adding or changing UI, search openaa-app for existing reusable components and use them when appropriate.
10. If a feature had admin configurability in the old site, the new site must preserve that configurability using the new schema, admin_roles, feature_flags, and shared components.
11. Do not write four duplicate implementations just to move faster.
12. Do not copy old temporary structures, repeated logic, ADMIN_TOKEN patterns, or scattered query patterns into the new project.
13. For any future page or module whose display behavior exists in the old site, first inspect the corresponding openaa-ny implementation in read-only mode, then rebuild it with the new shared-component approach.
14. For any future feature that had admin configurability in the old site, preserve or improve that configuration capability in the new site.
15. Every PR must state whether it referenced old-site functionality or display behavior, whether it reused shared components, and whether it introduced any repeated logic.
