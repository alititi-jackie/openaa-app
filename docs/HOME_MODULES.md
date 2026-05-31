# Home Modules

This document records the intended home-page module direction after the visual-parity pass with ny.openaa.com.

## Current PR Scope

This PR only aligns the home-page display style. It does not add admin CRUD, import old data, connect to the old Supabase project, add tables, or change the confirmed app-shell responsive width.

## Latest Posts

The home latest-posts module is designed to be controlled later by a `home_sections` row whose `key` is `latest_posts`.

Future `home_sections.config.sections` should support:

- `title`
- `post_type`
- `route`
- `is_visible`
- `sort_order`
- `limit_count`
- `layout`

The visual structure is intentionally home-specific: a compact internal navigation bar and lightweight aggregation cards. It should not reuse the larger channel-list card layout directly.

## Utility Tools

The utility tools module is designed to be controlled later by a `home_sections` row whose `key` is `utility_tools`.

Future `home_sections.config.items` should support:

- `title`
- `description`
- `href`
- `icon`
- `theme`
- `sort_order`
- `is_visible`
- `open_mode`

The current visual structure shows one group of two cards at a time. Mobile users can swipe horizontally; desktop users can use arrow controls to switch to the next group.

## Later Phases

Recommended follow-up order:

1. Home configuration data reads from `home_sections`, `latest_ticker`, `home_banners`, `ads`, and `top_quick_links`.
2. Admin configuration management using the new `admin_roles` and permission model.
3. Carefully scoped seed/import work for old display configuration, without copying old application code or connecting the app runtime to the old Supabase project.
