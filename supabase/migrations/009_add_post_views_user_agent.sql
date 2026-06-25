alter table public.post_views
  add column if not exists user_agent text;

comment on column public.post_views.user_agent is
  'Stores the trimmed browser user agent recorded by record_post_view for view analytics compatibility.';
