# Supabase

This directory defines the canonical OpenAA Supabase baseline. Do not connect to or reuse unrelated or retired Supabase projects.

The migration chain starts with the launch baseline:

1. `migrations/001_baseline_schema.sql`
2. `migrations/002_baseline_rls.sql`
3. `migrations/003_seed_required_settings.sql`

Subsequent numbered migrations evolve the schema and policies. Apply all migrations in order to the intended environment. Do not rerun baseline schema creation against an existing database. After a schema change, regenerate `lib/supabase/database.ts` as described in `lib/supabase/README.md`.
