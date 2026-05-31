# Migrations

Phase 2 creates the first schema foundation for the new OpenAA Supabase project.

Apply files in numeric order:

1. `001_init_enums_and_cities.sql`
2. `002_auth_profiles.sql`
3. `003_admin_permissions.sql`
4. `004_feature_flags.sql`
5. `005_posts_core.sql`
6. `006_media_storage.sql`
7. `007_news_navigation_home.sql`
8. `008_notifications_feedback.sql`
9. `009_dmv.sql`
10. `010_legal_consents.sql`
11. `011_seed_initial_settings.sql`
12. `012_seed_feature_flags.sql`
13. `013_seed_admin_permissions.sql`

These migrations are for the new `openaa-app` Supabase project only. Do not run them against the old `openaa-ny` project.
