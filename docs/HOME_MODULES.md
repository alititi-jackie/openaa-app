# Home Modules

This document records the home-page module structure after the visual parity pass, the Phase 9 configuration read layer, and the Phase 10 admin management foundation.

## Current PR Scope

Phase 10 adds the first admin management screens for the home configuration layer. It does not import archived data, connect to source Supabase projects, add unrelated admin CRUD, or change the confirmed app-shell responsive width.

## Read Strategy

The home page reads public configuration through `features/home/queries.ts`. Components should not query Supabase directly.

Supported sources:

- `top_quick_links`: city quick links in the Header dropdown.
- `ads`: primary home banner/ad data for the `home` placement.
- `home_banners`: compatibility home banner table retained for image-reference protection.
- `latest_ticker`: one-line latest-dynamics ticker.
- `home_sections`: module visibility, ordering, and module-specific config.
- `posts`: latest public posts for the home aggregation module.

The read layer uses the normal Supabase server client with the public anon key and RLS. It does not use the service role key.

Fallback rules:

- If Supabase env is missing, the home page renders fallback configuration.
- If a query fails, the home page renders fallback configuration and logs a development-only warning.
- Production users should not see technical Supabase configuration messages on the home page.
- If a configured module is visible but has no content, render the module-specific lightweight empty message.

## Latest Posts

The home latest-posts module is controlled by a `home_sections` row whose `key` is `latest_posts`.

`home_sections.config.sections` supports:

- `title`
- `post_type`
- `route`
- `is_visible`
- `sort_order`
- `limit_count`
- `layout`

Visibility rules:

- If the `latest_posts` module is disabled, hide the entire module and do not render an empty state.
- If a section has `is_visible=false`, hide that tab and its content.
- If a visible section has no content, render a compact one-line message instead of a large empty-state card.
- Do not add mock posts to the production home page.
- News is reserved for future `news_posts` reads; until then it may render an empty lightweight message without fake news.

## Utility Tools

The utility tools module is controlled by a `home_sections` row whose `key` is `utility_tools`.

`home_sections.config.items` supports:

- `title`
- `description`
- `href`
- `icon`
- `theme`
- `sort_order`
- `is_visible`
- `open_mode`

The current visual structure shows one group of two cards at a time. Mobile users can swipe horizontally; desktop users can use arrow controls to switch to the next group.

Visibility rules:

- If the `utility_tools` module is disabled, hide the entire module.
- If an item has `is_visible=false`, hide that tool.
- If the module is enabled but no tools are visible, hide the entire module rather than rendering an empty state.

## Quick Grid

The quick grid uses the same confirmed visual style from PR #7 and PR #8. It can be controlled by a `home_sections` row whose `key` is `quick_grid`.

`home_sections.config.items` supports:

- `label` or `title`
- `href`
- `sort_order`
- `is_visible`
- `feature_key`

The current implementation maps configured entries to the existing icon set by route or label, and falls back to the static grid if no usable config exists. Feature flags remain part of the planned control surface; the home section config should hide entries whose features are intentionally unavailable until a broader public feature-flag read policy is finalized.

## Banner And Ads

The admin home page no longer edits home banners directly. Home top ad placement should be configured in `/admin/ads`.

The public read layer still understands `home_banners` rows for compatibility, but home-top advertising should use active `ads` rows whose placement is `home`.

Images are mapped from `image_assets.public_url` or `image_assets.external_url`. External images should use the approved external image host such as `img.openaa.com`; the home page does not upload or import images in this phase.

If no configured home ad or compatible banner row is readable, the existing fallback banner is used.

## Latest Ticker

The ticker reads enabled `latest_ticker` rows within the start/end window. If no readable rows exist, the fallback one-line ticker remains in place. The ticker should stay as one compact line: icon, “最新动态”, then content.

## SEO Content

The SEO content card can be controlled by `home_sections` with `key = seo_content`.

Supported config fields:

- `title`
- `content`
- `is_visible`

If no readable config exists, the fallback SEO copy is used. If the module is disabled, the SEO card is hidden. SEO copy should remain natural and should not become keyword stuffing.

## Admin Management

Phase 10 adds:

- `/admin/home`: manages `home_sections` and `latest_ticker`; it shows a note that the home top ad placement is configured in ad management.
- `/admin/navigation?tab=top-links`: manages `top_quick_links`.

Permissions:

- `manage_home_sections`: update home modules.
- `manage_top_links`: create, edit, sort, and disable top quick links.
- `manage_latest_ticker`: create and edit latest ticker rows.
- `manage_ads`: reserved for broader ad management. Phase 10 does not build a full ads CRUD screen.

All write operations run through server actions, check Supabase Auth plus `admin_roles` permission helpers, and insert `admin_audit_logs` records. Frontend button visibility is only a UI hint and is not treated as a security boundary.

Default configuration:

- Admins with `manage_home_sections` can create default `home_sections` matching the current fallback modules.
- If the same admin also has `manage_top_links`, the default top quick links are created.
- If the same admin also has `manage_latest_ticker`, the default ticker row is created when no ticker exists.

Banner image policy:

- Home top ad images are managed through the ad management flow and ad image fallback rules.
- The compatibility `home_banners` table is not edited from `/admin/home`.

Schema patch:

- Migration `015_home_config_admin_fields.sql` adds `open_mode` to `top_quick_links`, `home_banners`, and `ads`, and adds `city_id` to `top_quick_links`.
- The patch does not add tables and does not loosen existing RLS policies.

## Later Phases

Recommended follow-up order:

1. Broader ad management, if needed, using `manage_ads`.
2. Carefully scoped seed/import work for archived display configuration, without copying external application code or connecting the app runtime to source Supabase projects.
3. Optional dynamic sitemap enhancements for configured public content once real data exists.
