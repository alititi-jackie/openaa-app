# Unified analytics

## Scope and implementation

`/admin/analytics` reuses `site_page_views`, the existing authenticated Supabase client,
admin gate, row-level security and atomic rate limiter. No new analytics database or
public read API. The original dashboard remains OpenAA-only.

- Four sites: OpenAA, DMV, Tools, Go; explicit HTTPS origin allowlist.
- Today / yesterday / last 7 / last 30 calendar days in America/New_York.
- PV, per-site distinct browser UV, daily zero-filled trends, Top 50 pages,
  referring host, device, browser, OS, country and region.
- The sum across sites is **not** cross-domain deduplicated people. Legacy rows
  retain their original user/browser identifiers. This introduces a measurement
  discontinuity when the new collector starts using browser IDs for signed-in users.
- Page views are not button clicks. No claim of perfect human/bot classification.
- Country/region use Vercel's platform headers only when running on Vercel. Missing
  geography stays unknown. User-agent dimensions are approximate.
- Sources are per-page referrers, including internal referrals, not marketing
  session attribution. Unknown referrers are not inferred to be Xiaohongshu.

## Collection

`public/analytics/tracker.js` is the single SDK, loaded after hydration by Next.js,
and deferred in static/Astro sites. It observes pathname transitions, suppresses
same-path history changes, records reloads and back/forward-cache restores, and
waits for hidden tabs to become visible. Blocked localStorage falls back to a
page-lifetime ID. No query strings, input values, click text or cookies are collected.
Referrer URLs are reduced to hostnames server-side. Anonymous subsites omit credentials.

The receiver limits body size to 4 KiB while streaming, validates origin/path/ID,
filters common bot UAs and enforces database-backed per-IP and per-IP/path limits.
The existing rate-limit table uses IP for abuse control; analytics rows do not
store IP. Origin checks do not authenticate arbitrary HTTP clients: bots can
forge requests. UUID event IDs make duplicate submissions idempotent.

The SDK only runs on the four production hosts. Vercel preview collectors skip
writes. Preview deployments therefore do not inflate production traffic.

## Rollout (production not applied in this change)

1. Review branches in all four repositories and backup the database as usual.
2. Apply `033_unified_analytics.sql` to the existing database **before** deploying
   new collection code. The migration is additive; previous collector remains compatible.
3. Deploy OpenAA first; check admin access and the collector/script URL.
4. Deploy DMV, Tools and Go integrations. No historical subsite visits are backfilled.
5. Open one production page on each site and verify one new row and expected site
   in the authenticated dashboard. Check a client-side DMV transition and Go reload.

Revert app/subsite commits to stop new integrations; retain additive schema columns.
No automatic raw-event deletion is introduced. Monitor table growth; decide retention
and archived daily aggregates with the owner before deleting history.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Collector unit tests cover origin spoofing, path/referrer sanitation, SPA changes,
  history return values, duplicate suppression, blocked storage, hidden tabs and previews.
- Isolated database test (no production access):
  `npm install --prefix /tmp/openaa-analytics-test --no-save @electric-sql/pglite`
  `PGLITE_MODULE=/tmp/openaa-analytics-test/node_modules/@electric-sql/pglite/dist/index.js node tests/integration/analytics-db.mjs`
  Tests actual migrations, aggregation, RLS, execute/insert grants, UUID dedupe and DST.
- Live production database schema and signed-in end-to-end behavior require the staged
  rollout check; this work does not assert production migration execution.
