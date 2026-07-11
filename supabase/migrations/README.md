# Migrations

This directory is the production baseline for the OpenAA Supabase project.

Current order:

1. `001_baseline_schema.sql`
2. `002_baseline_rls.sql`
3. `003_seed_required_settings.sql`

The previous test-phase migrations were intentionally removed. Because current
data is disposable, reset the target Supabase database before applying this
baseline. Do not run these files against unrelated or retired Supabase projects.
