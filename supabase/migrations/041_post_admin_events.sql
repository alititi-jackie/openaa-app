create table if not exists public.post_admin_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  template_key text,
  status_before text,
  status_after text,
  title text,
  body text,
  notification_id uuid references public.notifications(id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.posts
  add column if not exists last_admin_action text,
  add column if not exists last_admin_action_at timestamptz,
  add column if not exists last_admin_action_by uuid references auth.users(id) on delete set null,
  add column if not exists last_admin_action_template_key text,
  add column if not exists last_admin_action_reason text;

create index if not exists post_admin_events_post_id_created_at_idx
  on public.post_admin_events (post_id, created_at desc);

create index if not exists posts_last_admin_action_idx
  on public.posts (last_admin_action, last_admin_action_at desc)
  where last_admin_action is not null;

alter table public.post_admin_events enable row level security;

revoke all on public.post_admin_events from anon, authenticated;
grant select, insert on public.post_admin_events to authenticated;

drop policy if exists "Admins can read post admin events" on public.post_admin_events;
create policy "Admins can read post admin events"
  on public.post_admin_events
  for select
  to authenticated
  using (
    public.has_admin_permission('view_posts')
    or public.has_admin_permission('moderate_posts')
  );

drop policy if exists "Admins can create post admin events" on public.post_admin_events;
create policy "Admins can create post admin events"
  on public.post_admin_events
  for insert
  to authenticated
  with check (public.has_admin_permission('moderate_posts'));
