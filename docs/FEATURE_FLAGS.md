# Feature Flags

Feature flags are part of the platform foundation. They control module availability, frontend entry visibility, user access, sitemap inclusion, and admin testing visibility.

## Default Enabled

`home`, `auth_email`, `auth_google`, `profiles`, `business_profiles_basic`, `jobs`, `housing`, `marketplace`, `services`, `news`, `dmv`, `navigation`, `search_basic`, `favorites`, `recent_views`, `drafts`, `feedback`, `reports`, `notifications_in_app`, `system_announcements`, `ads`, `pwa`, `seo`, `admin_roles`, `image_management`.

## Default Disabled

Apple/WeChat/phone auth, push delivery, community interaction modules, business verification, business public pages, booking and promotion modules, memberships, points, payments, orders, chats, rideshare, multi-city public publishing, app deep links, and ad packages.

Disabled features should hide frontend entries, reject server actions with `feature_disabled`, stay out of sitemap, and use `noindex` when a placeholder page exists.

## Schema

The `feature_flags` table supports:

- module-level enable/disable
- `public`, `admin_only`, `beta`, and `hidden` visibility
- optional city scoping
- optional role and account type constraints
- JSON config for module-specific behavior
- start and end windows

Feature flag checks must happen on the server before a future API or server action performs work.
