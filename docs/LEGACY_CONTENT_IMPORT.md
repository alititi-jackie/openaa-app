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
- Use reviewed JSON files in `data/legacy/`.
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

- `data/legacy/navigation.json`
- `data/legacy/news-categories.json`
- `data/legacy/news-posts.json`
- `data/legacy/ads.json`
- `data/legacy/ticker.json`
- `data/legacy/top-links.json`
- `data/legacy/home-sections.json`

Seed-A includes `.example.json` files only. The import script uses real files when present and falls back to examples for dry-run validation.

## Dry Run

Dry-run is the default and does not write a database.

```bash
npm run import:legacy -- --module=navigation --env=local --dry-run
npm run import:legacy -- --module=all --env=staging --dry-run
```

The package scripts use the current Node runtime's TypeScript strip mode:

```bash
node --experimental-strip-types scripts/import-legacy-content.ts
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

## Apply

Seed-A does not implement database writes. Future Seed-B can add local/staging apply support behind explicit flags:

```bash
npm run import:legacy -- --module=navigation --env=staging --apply
```

Production must always include a second confirmation:

```bash
npm run import:legacy -- --module=all --env=production --apply --confirm-production
```

Without `--confirm-production`, production runs are rejected.

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
- Do not place legacy or demo content in `supabase/seed.sql`.
- Do not run production imports without human approval.
- Do not let demo user posts enter production sitemap unless explicitly approved.
- Do not alter RLS as part of content import.
