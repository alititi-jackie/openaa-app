# Supabase

This project uses a new Supabase project only. Do not connect to or reuse the old `openaa-ny` Supabase project.

The current migration chain is a clean launch baseline:

1. `migrations/001_baseline_schema.sql`
2. `migrations/002_baseline_rls.sql`
3. `migrations/003_seed_required_settings.sql`

Apply this baseline only to a fresh or intentionally reset local/staging/production database. Do not apply it on top of the old test-period migration chain. After a reset, regenerate `lib/supabase/database.ts` with Supabase CLI.
