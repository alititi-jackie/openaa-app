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

Seed-B1 keeps old-site `/secondhand` references mapped to the new `/marketplace` route. Ticker data represents configuration only and does not include user-post aggregation output.
