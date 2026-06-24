alter table public.user_navigation_links
  add column if not exists open_mode text not null default 'new';

alter table public.user_navigation_links
  drop constraint if exists user_navigation_links_open_mode_check;

alter table public.user_navigation_links
  add constraint user_navigation_links_open_mode_check
  check (open_mode in ('same', 'new'));
