# RLS Policies

All business tables in Phase 2 explicitly enable row level security. The schema does not rely on Supabase automatic RLS as the full permission model.

## Helper Functions

- `public.is_admin()`
- `public.is_super_admin()`
- `public.has_admin_permission(permission_key text)`
- `public.is_profile_publicly_allowed(user_id uuid)`
- `public.can_user_publish(user_id uuid)`
- `public.is_public_post(post_id uuid)`
- `public.is_post_author(post_id uuid)`

Helper functions are `SECURITY DEFINER` and return only permission booleans. They do not expose raw admin rows to ordinary users.

## Public Read

Public users can read:

- active cities
- public site settings
- published public posts that are not expired and whose author is not banned
- active public business profiles
- published news
- active navigation categories and links
- active home banners, sections, top quick links, latest ticker, and ads
- active system announcements
- active DMV questions
- public active image assets

## User-Owned Data

Authenticated users can manage their own:

- profile and settings
- business profile
- blocks
- user favorites in `user_favorites`
- post drafts
- navigation links/settings
- notifications: users can read their own non-deleted notifications; mark-read and soft-delete flows run through controlled server actions with service role writes
- DMV progress, wrong questions, and exam results
- consents and account deletion requests
- push subscriptions

## Protected Data

Post contact data is not public. It is readable by the post author and admins with `view_post_contacts`.

Admin tables are not readable by ordinary users. Admin reads and writes depend on permission checks, and service role remains server-only.

`admin_roles` has additional protection: non-`super_admin` admins cannot create or modify `super_admin` rows, and a trigger blocks disabling or demoting the final active `super_admin`.

## Notifications

Notification writes are controlled by server actions and the notification service, not by public client inserts.

- Ordinary users can only view their own notifications where `deleted_at is null`.
- Ordinary users cannot directly update notification rows from the client.
- Mark-read server actions only set `read_at` from `null` to the current time for the signed-in user's own non-deleted notifications.
- Soft-delete server actions only set `deleted_at` from `null` to the current time for the signed-in user's own notifications.
- Ordinary users cannot restore soft-deleted notifications, mark read notifications unread, or modify notification title, body, user ownership, creator, metadata, target fields, or action links.
- Admin notification list and single-user sends require `manage_notifications`.
- Bulk notification sends require `super_admin`.
- Admin sends, bulk sends, and system-generated moderation notifications write `admin_audit_logs`.
- `notification_templates` is managed by admins with `manage_notifications`.

Automatic first-version system notifications are created for admin post deletion to recycle bin, recycle-bin restore of user posts, and admin rejection of user posts when the admin chooses "通知用户并执行".

## Anonymous Inserts

Anonymous insert is allowed only for controlled public intake:

- post views with `visitor_id`
- post reports with `visitor_id`
- feedback without `user_id`

These paths still require server-side rate limiting before production use.
