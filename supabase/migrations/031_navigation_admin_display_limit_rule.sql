-- Keep navigation category display limits explicit and non-negative.
alter table public.navigation_categories
  drop constraint if exists navigation_categories_display_limit_nonnegative;

alter table public.navigation_categories
  add constraint navigation_categories_display_limit_nonnegative
    check (display_limit >= 0);
