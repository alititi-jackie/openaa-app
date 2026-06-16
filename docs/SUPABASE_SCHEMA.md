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
14. `038_notifications_first_version.sql`
15. `039_notifications_rls_hardening.sql`
16. `040_notification_templates_post_management.sql`
17. `041_post_admin_events.sql`
18. `042_default_post_placeholder_images.sql`
19. `043_site_setting_images_storage_policies.sql`
20. `044_image_assets_entity_id_text.sql`

## Core Tables

- Cities and system: `cities`, `site_settings`, `rate_limits`, `search_logs`.
- Users: `profiles`, `business_profiles`, `user_auth_identities`, `user_settings`, `user_security_logs`, `user_blocks`, `user_consents`, `account_deletion_requests`.
- Admin: `admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_user_permissions`, `admin_audit_logs`.
- Feature flags: `feature_flags`.
- Posts: `posts`, `post_details_jobs`, `post_details_housing`, `post_details_marketplace`, `post_details_services`, `post_contacts`, `post_stats`, `post_views`, `post_reports`, `post_moderation_logs`, `post_admin_events`, `post_drafts`, `post_images`.
- Favorites: `user_favorites`.
- Media: `image_assets`.
- Content and operations: `news_categories`, `news_posts`, `navigation_categories`, `navigation_links`, `user_navigation_links`, `user_navigation_settings`, `home_banners`, `home_sections`, `top_quick_links`, `latest_ticker`, `ads`.
- Notifications and support: `notifications`, `notification_templates`, `system_announcements`, `support_tickets`, `support_ticket_settings`, `support_ticket_events`, `push_subscriptions`.
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

Seeded templates: `admin_post_deleted`, `admin_post_hidden`, `admin_post_restored`, `admin_post_published`, `admin_post_rejected`, `content_issue`, `image_issue`, `contact_issue`, `missing_info`, `wrong_category`, `duplicate_post`, `system_announcement`, and `account_notice`.

Admin sends, bulk sends, and automatic moderation notifications use `features/notifications/service.ts` and write audit records to `admin_audit_logs`.

## Support Tickets

`support_tickets` is the first-version platform feedback and report ticket system. It replaces the old `feedback` / `feedback_posts` / `feedback_settings` tables. The content moderation report table `post_reports` remains separate because it powers post report counts, "already reported" state, and post moderation workflows.

Fields:

- `id`
- `ticket_no`
- `user_id`
- `visitor_id`
- `type`
- `source`
- `target_type`
- `target_id`
- `related_url`
- `contact_info`
- `content`
- `status`
- `priority`
- `admin_reply`
- `admin_note`
- `handled_by`
- `handled_at`
- `closed_at`
- `created_at`
- `updated_at`
- `deleted_at`

`support_ticket_settings` stores runtime submission limits and field length constraints:

- `enabled`
- `daily_user_limit`
- `daily_visitor_limit`
- `daily_total_limit`
- `content_min_length`
- `content_max_length`
- `contact_max_length`
- `related_url_max_length`

`support_ticket_events` stores ticket creation and administrator handling events. The first UI version writes events for ticket creation, status changes, priority changes, public reply edits, and internal note edits, but does not render a full timeline yet.

## User Post Admin Events

`post_admin_events` stores business-level administrator handling records for user-published content. It is separate from `admin_audit_logs`: audit logs remain the global trace, while `post_admin_events` powers post management status display and future detail timelines.

Fields:

- `id`
- `post_id`
- `actor_id`
- `event_type`
- `template_key`
- `status_before`
- `status_after`
- `title`
- `body`
- `notification_id`
- `created_at`
- `metadata`

`posts` also stores a denormalized latest administrator handling summary for list views:

- `last_admin_action`
- `last_admin_action_at`
- `last_admin_action_by`
- `last_admin_action_template_key`
- `last_admin_action_reason`

User self-service actions do not write `post_admin_events`. Administrator post actions may update the latest summary and append a `post_admin_events` row.

## Default Post Placeholder Images

`042_default_post_placeholder_images.sql` adds the `site-setting-images` public Storage bucket and two public `site_settings` keys:

- `default_marketplace_placeholder_image`
- `default_service_placeholder_image`

Each setting stores JSON with:

- `url`
- `imageAssetId`
- `sourceType`

These settings are only used for public marketplace and service display when the post has no user-uploaded image. They do not create `post_images` rows and do not affect the user publish flow. Uploaded and external placeholder images are represented in `image_assets` with `entity_type = site_setting` and `entity_id` equal to the setting key, so the image cleanup tool treats them as business-referenced assets.

`043_site_setting_images_storage_policies.sql` ensures the `site-setting-images` Storage policies exist. `044_image_assets_entity_id_text.sql` changes `image_assets.entity_id` from `uuid` to `text` so generic media references can point to UUID-backed rows or text-backed setting keys.

## Type Generation

`types/database.ts` is a placeholder only. After the new Supabase project is available locally, generate real types with Supabase CLI and replace the placeholder.
