# Legacy content data

This directory holds reviewed JSON exports for migrating OpenAA operating content into `openaa-app`.

Seed-A includes example files only. Do not commit large real exports, user-post demo data, Supabase keys, or old database dumps in this step.

Use these source markers when preparing real files:

```json
{
  "source": "legacy_official_import",
  "origin": "openaa-ny",
  "approved_for": "initial_production_content"
}
```

Future user-post demo data must use a different marker and is not part of Seed-A:

```json
{
  "source": "legacy_demo_import",
  "origin": "openaa-ny",
  "imported_for": "visual_testing"
}
```

Preferred real file names:

- `navigation.json`
- `news-categories.json`
- `news-posts.json`
- `ads.json`
- `ticker.json`
- `top-links.json`
- `home-sections.json`

The import script falls back to the `.example.json` files for dry-run validation.

## Seed-B1

Seed-B1 adds reviewed official operating-content JSON for:

- `navigation.json`
- `top-links.json`
- `ticker.json`

These files use `legacy_official_import` and are candidates for initial production content. They are JSON data only; no database import is performed by committing them.

Seed-B1 keeps marketplace references using the canonical `/marketplace` route. Ticker data represents configuration only and does not include user-post aggregation output.

## Seed-B2

Seed-B2 adds reviewed official operating-content JSON for:

- `news-categories.json`
- `news-posts.json`
- `ads.json`
- `home-sections.json`

These files use `legacy_official_import` and are candidates for initial production content. They are JSON data only; committing them does not import a database.

Seed-B2 includes only published public news from old-site sitemap/pages. Draft, hidden, deleted, and user-post content remain out of scope. Old Supabase Storage images are not migrated as official images: news covers are marked for replacement and ads with old Storage images are skipped.

Marketplace references use canonical `/marketplace`, including `marketplace_top` ad placement and marketplace latest-post configuration. News, ads, and SEO content may include review notes such as `needs_freshness_review`, `cover_needs_replacement`, `needs_human_review`, or `needs_domain_review`.

## Seed-B3

Seed-B3 adds local/staging `--apply` support for the reviewed `legacy_official_import` files in this directory. The default command is still dry-run and does not write a database.

Supported official modules:

- `navigation`
- `top-links`
- `ticker`
- `news`
- `ads`
- `home`
- `all`

Seed-B3 does not import user posts, contacts, user images, or demo content. It does not write migrations or `supabase/seed.sql`. External images stay as `https://img.openaa.com/...` references through `image_assets` records and are not downloaded or uploaded.

Production apply is disabled for this phase. Local apply uses local Supabase credentials from environment variables or Supabase CLI status; staging apply requires explicit environment variables.
