# Legacy Content Import

Seed-A provides a safe skeleton for importing reviewed `openaa-ny` operating content into `openaa-app`. It does not import data, connect to the old Supabase project, add migrations, or change UI.

## Content Types

Operating content can become official initial production content after review:

- Navigation categories and links
- News categories and published news posts
- Ads and home banners
- Latest ticker items
- Top quick links
- Home sections and SEO copy
- Platform announcements

Future user-post demo content is separate and must not be imported in Seed-A:

- Jobs
- Housing
- Marketplace posts
- Services
- Contacts and user-post images

User-post demo content is only for local or staging visual testing. It must be tagged with `legacy_demo_import` and cleaned before production unless the owner explicitly approves keeping it.

## Source Rules

- Do not connect to the old Supabase project.
- Do not use old Supabase connection strings.
- Do not read the old database directly.
- Do not download or re-upload `img.openaa.com` images.
- Use reviewed JSON files in `tools/archive/legacy/`.
- Keep images as external URLs.

Operating content metadata:

```json
{
  "source": "legacy_official_import",
  "origin": "openaa-ny",
  "approved_for": "initial_production_content"
}
```

Future demo post metadata:

```json
{
  "source": "legacy_demo_import",
  "origin": "openaa-ny",
  "imported_for": "visual_testing"
}
```

## Preparing JSON

Preferred real file names:

- `tools/archive/legacy/navigation.json`
- `tools/archive/legacy/news-categories.json`
- `tools/archive/legacy/news-posts.json`
- `tools/archive/legacy/ads.json`
- `tools/archive/legacy/ticker.json`
- `tools/archive/legacy/top-links.json`
- `tools/archive/legacy/home-sections.json`

Seed-A includes `.example.json` files only. The import script uses real files when present and falls back to examples for dry-run validation.

## Seed-B1 Official JSON

Seed-B1 adds the first reviewed `legacy_official_import` JSON files:

- `tools/archive/legacy/navigation.json`
- `tools/archive/legacy/top-links.json`
- `tools/archive/legacy/ticker.json`

These files are official operating-content candidates for initial production content. They do not import anything by themselves, do not connect to the old Supabase project, do not add migrations, and do not change UI.

Seed-B1 source rules:

- Navigation and top links are prepared from old-site public API output and read-only review.
- Old `/secondhand` routes are mapped to `/marketplace`; the new app must not restore `/secondhand`.
- Ticker JSON stores the configuration layer only. It does not seed user-post aggregation results from the old ticker API.
- Images remain external references. Do not download or re-upload `img.openaa.com` assets.
- News, ads, and home sections are intentionally left for Seed-B2.
- User-post demo content remains out of scope until Seed-C.

## Seed-B2 Official JSON

Seed-B2 adds the second reviewed `legacy_official_import` JSON batch:

- `tools/archive/legacy/news-categories.json`
- `tools/archive/legacy/news-posts.json`
- `tools/archive/legacy/ads.json`
- `tools/archive/legacy/home-sections.json`

These files are JSON-only operating-content candidates. They do not import a database, connect to old Supabase, add migrations, or change UI.

Seed-B2 source rules:

- News categories and posts come from old-site public sitemap and public news pages.
- Only published public news is included; draft, hidden, and deleted news are excluded.
- Old Supabase Storage images are not used as official images. News covers with old Storage URLs use `cover_image_url: null` and `metadata.notes: ["cover_needs_replacement"]`; ads with old Storage images are skipped.
- Old `/secondhand` references are mapped to `/marketplace`, including ads placement `secondhand -> marketplace_top` and home latest section `latest_secondhand -> marketplace`.
- Ads are imported only from active public API output. Legacy `external_same` / `external_new` modes are mapped to `same` / `new` while keeping `metadata.legacy_open_mode`.
- Policy, fee, DMV, and time-sensitive news uses `metadata.notes: ["needs_freshness_review"]`.
- SEO/domain text uses review notes where appropriate, such as `needs_domain_review`.
- User-post content remains out of scope until Seed-C.

Seed-B2 image review totals:

- News covers from `img.openaa.com`: 18.
- News covers needing replacement: 1.
- Imported ad images from `img.openaa.com`: 18 unique URLs across 29 ads.
- Skipped old Storage ad images: 2.

## Dry Run

Dry-run is the default and does not write a database.

```bash
npm run import:legacy -- --module=navigation --env=local --dry-run
npm run import:legacy -- --module=all --env=staging --dry-run
```

The package scripts use the current Node runtime's TypeScript strip mode:

```bash
node --experimental-strip-types tools/archive/import-legacy-content.ts
```

Use Node 22 or newer for these scripts. If a future deployment or CI environment must run older Node, add an explicit lightweight runner such as `tsx` in a separate PR instead of changing Seed-A behavior.

Supported modules:

- `navigation`
- `news`
- `ads`
- `ticker`
- `top-links`
- `home`
- `all`

## Seed-B3 Local/Staging Apply

Seed-B3 adds apply support for reviewed `legacy_official_import` operating content only:

- `navigation`
- `top-links`
- `ticker`
- `news`
- `ads`
- `home`
- `all`

Apply remains opt-in. Commands without `--apply` are dry-runs and do not write a database.

```bash
npm run import:legacy -- --module=all --env=local --dry-run
npm run import:legacy -- --module=all --env=local --apply
```

On Windows/npm setups where a bare `--apply` is swallowed by npm instead of forwarded as an argument, use an explicit environment variable for the apply run:

```powershell
$env:LEGACY_IMPORT_APPLY="true"
npm run import:legacy -- --module=all --env=local
Remove-Item Env:\LEGACY_IMPORT_APPLY
```

Local apply reads local Supabase connection details from dedicated import environment variables when present:

```bash
LEGACY_IMPORT_SUPABASE_URL=http://127.0.0.1:54321
LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY=...
```

The local URL must be `localhost`, `127.0.0.1`, or `::1`. If those variables are absent, local apply reads the running Supabase CLI status output. The script does not read generic `SUPABASE_URL`, generic service-role variables, or `.env.production` for local apply. No key is committed to the repository.

Staging apply requires explicit environment variables:

```bash
LEGACY_IMPORT_SUPABASE_URL=https://...
LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY=...
npm run import:legacy -- --module=all --env=staging --apply
```

Production apply is intentionally disabled in Seed-B3. Do not use `.env.production`, cloud project URLs, or old Supabase credentials for this script.

Apply writes only official operating content:

- `navigation_categories` and `navigation_links`
- `top_quick_links`
- `latest_ticker`
- `news_categories` and `news_posts`
- `ads`
- `home_sections`
- `image_assets` records for `https://img.openaa.com/...` external images

It does not import user-post content such as jobs, housing, marketplace, services, contacts, or user images. Those remain reserved for Seed-C demo/staging work.

Image handling:

- External images use `source_type = external`.
- `external_url` and `public_url` keep the `img.openaa.com` URL.
- `external_host = img.openaa.com`.
- `is_public = true`.
- Images are not downloaded or uploaded.
- Old Supabase Storage URLs are skipped or kept only as review notes in JSON.

Idempotency strategy:

- Navigation categories: `slug`
- Navigation links: `metadata.legacy_id`, then `category_id + url`
- Top quick links: `key`, then `href + title`
- Latest ticker: `module + title + href`
- News categories: `slug`
- News posts: `slug`
- Ads: `metadata.legacy_id`, then `placement + image_asset_id + title`
- Home sections: `key`
- Image assets: `external_url`

Repeat runs should update existing official rows rather than creating duplicates. This script does not implement automatic cleanup for `legacy_official_import`; official operating content should be reviewed and edited intentionally rather than bulk-deleted.

## Production Apply

Production apply is not available in Seed-B3. Any `--env=production --apply` command must be rejected, even if additional confirmation flags are present. A future production import should be handled in a separate reviewed phase with explicit owner approval.

## Cleanup Demo Posts

Seed-A does not import user posts. The cleanup skeleton documents the future guardrail:

```bash
npm run cleanup:demo-posts -- --env=local --dry-run
```

Future cleanup must only target rows tagged with:

```sql
metadata->>'source' = 'legacy_demo_import'
```

It must not clean `legacy_official_import` navigation, news, ads, ticker, top links, or home sections.

## Production Safety

- Do not place legacy or demo content in migrations.
- Do not place legacy or demo content in database seed files.
- Do not run production imports in Seed-B3.
- Do not let demo user posts enter production sitemap unless explicitly approved.
- Do not alter RLS as part of content import.
