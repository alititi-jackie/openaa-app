# Domain And SEO Strategy

The code must not hard-code `openaa.app` into canonical, sitemap, OpenGraph, JSON-LD, share links, or Auth redirect logic.

## Domains

- Current app domain: `openaa.app`
- Future primary SEO domain candidate: `openaa.com`
- Backup/redirect domain: `openaa.cn`

## Config

The source of truth is `lib/seo/siteConfig.ts`.

Environment variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_PRIMARY_SEO_URL`
- `NEXT_PUBLIC_CANONICAL_URL`

Sitemap, canonical URLs, OpenGraph URLs, and JSON-LD URLs should use the canonical base URL.
