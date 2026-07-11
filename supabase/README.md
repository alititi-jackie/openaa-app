# Supabase

This directory defines the canonical OpenAA Supabase baseline. Do not connect to or reuse unrelated or retired Supabase projects.

The current migration chain is a clean launch baseline:

1. `migrations/001_baseline_schema.sql`
2. `migrations/002_baseline_rls.sql`
3. `migrations/003_seed_required_settings.sql`

Apply this baseline only to a fresh or intentionally reset local/staging/production database. Do not apply it on top of an obsolete test-period migration chain. After a reset, regenerate `lib/supabase/database.ts` with Supabase CLI.
