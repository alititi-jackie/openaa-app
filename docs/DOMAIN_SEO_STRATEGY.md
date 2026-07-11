# Domain And SEO Strategy

Canonical, sitemap, OpenGraph, JSON-LD, share links, and Auth redirect URLs should resolve through `lib/seo/siteConfig.ts`.

## Domains

- Primary domain: `openaa.com`
- Additional redirect domains are handled outside the app in Vercel Project Domains or DNS/provider rules: `www.openaa.com`, `app.openaa.com`, `openaa.cn`, `www.openaa.cn`, `openaa.app`, `www.openaa.app`
- Independent subdomains: `tools.openaa.com`, `img.openaa.com`, `go.openaa.com`

## Config

The source of truth is `lib/seo/siteConfig.ts`.

Environment variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_PRIMARY_SEO_URL`
- `NEXT_PUBLIC_CANONICAL_URL`

Sitemap, canonical URLs, OpenGraph URLs, and JSON-LD URLs should use the canonical base URL.
