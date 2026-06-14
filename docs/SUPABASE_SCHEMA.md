# Supabase Schema

Phase 2 establishes the minimum viable platform schema for the new `openaa-app` Supabase project. It does not connect to the old Supabase project and does not import legacy data.

## Migration Order

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

## Core Tables

- Cities and system: `cities`, `site_settings`, `rate_limits`, `search_logs`.
- Users: `profiles`, `business_profiles`, `user_auth_identities`, `user_settings`, `user_security_logs`, `user_blocks`, `user_consents`, `account_deletion_requests`.
- Admin: `admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_user_permissions`, `admin_audit_logs`.
- Feature flags: `feature_flags`.
- Posts: `posts`, `post_details_jobs`, `post_details_housing`, `post_details_marketplace`, `post_details_services`, `post_contacts`, `post_stats`, `post_views`, `post_reports`, `post_moderation_logs`, `post_drafts`, `post_images`.
- Favorites: `user_favorites`.
- Media: `image_assets`.
- Content and operations: `news_categories`, `news_posts`, `navigation_categories`, `navigation_links`, `user_navigation_links`, `user_navigation_settings`, `home_banners`, `home_sections`, `top_quick_links`, `latest_ticker`, `ads`.
- Notifications and feedback: `notifications`, `notification_templates`, `system_announcements`, `feedback`, `push_subscriptions`.
- DMV: `dmv_questions`, `dmv_user_progress`, `dmv_wrong_questions`, `dmv_exam_results`, `dmv_question_imports`.
- Reserved simple tables: `comments`, `ratings`, `business_verifications`, `appointments`, `coupons`.

## Not Created In Phase 2

Payments, orders, chats, memberships, points, coupon redemption, and rideshare business tables are intentionally not created. They remain architecture directions only because they require more security, operations, and compliance design.

## Notifications

`notifications` stores in-app notifications only. It is not used for SMS, email, browser Push, or native Push.

Current fields:

- `id`
- `user_id`
- `type`
- `title`
- `body`
- `link_url`
- `action_url`
- `target_type`
- `target_id`
- `data`
- `metadata`
- `read_at`
- `deleted_at`
- `created_by`
- `created_at`

New notifications should prefer `action_url`. Existing `link_url` rows remain readable for compatibility. User-facing reads hide rows where `deleted_at` is not null, and user deletion is a soft delete by setting `deleted_at`.

`notification_templates` stores reusable notification copy:

- `id`
- `key`
- `title`
- `body`
- `type`
- `target_type`
- `is_active`
- `created_at`
- `updated_at`

Seeded templates: `admin_post_deleted`, `admin_post_restored`, `admin_post_rejected`, `content_issue`, `image_issue`, and `contact_issue`.

Admin sends, bulk sends, and automatic moderation notifications use `features/notifications/service.ts` and write audit records to `admin_audit_logs`.

## Type Generation

`types/database.ts` is a placeholder only. After the new Supabase project is available locally, generate real types with Supabase CLI and replace the placeholder.
