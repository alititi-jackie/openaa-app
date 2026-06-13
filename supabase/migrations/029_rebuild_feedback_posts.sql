begin;

drop table if exists public.feedback cascade;
drop table if exists public.feedback_posts cascade;
drop table if exists public.feedback_settings cascade;

create table public.feedback_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  type text not null,
  contact text,
  related_url text,
  content text not null,
  status text not null default 'pending',
  admin_note text,
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint feedback_posts_status_check check (status in ('pending', 'processing', 'resolved', 'ignored')),
  constraint feedback_posts_actor_check check (user_id is not null or visitor_id is not null)
);

create table public.feedback_settings (
  key text primary key,
  value integer not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint feedback_settings_value_check check (value between 1 and 1000)
);

insert into public.feedback_settings (key, value)
values
  ('feedback_daily_user_limit', 5),
  ('feedback_daily_total_limit', 100);

insert into public.top_quick_links (key, title, href, icon, sort_order, is_active)
values ('feedback', '反馈', '/feedback', 'message-square', 80, true)
on conflict (key) do update
set
  title = excluded.title,
  href = excluded.href,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

create index feedback_posts_status_created_idx
  on public.feedback_posts (status, created_at desc)
  where deleted_at is null;

create index feedback_posts_type_created_idx
  on public.feedback_posts (type, created_at desc)
  where deleted_at is null;

create index feedback_posts_user_created_idx
  on public.feedback_posts (user_id, created_at desc)
  where deleted_at is null;

create index feedback_posts_visitor_created_idx
  on public.feedback_posts (visitor_id, created_at desc)
  where deleted_at is null;

create or replace function public.set_feedback_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_feedback_posts_set_updated_at on public.feedback_posts;
create trigger trg_feedback_posts_set_updated_at
before update on public.feedback_posts
for each row
execute function public.set_feedback_posts_updated_at();

alter table public.feedback_posts enable row level security;
alter table public.feedback_settings enable row level security;

create policy "Users and visitors can submit feedback posts"
  on public.feedback_posts
  for insert
  to anon, authenticated
  with check (
    (
      auth.uid() is not null
      and user_id = auth.uid()
    )
    or (
      auth.uid() is null
      and user_id is null
      and visitor_id is not null
      and length(btrim(visitor_id)) > 0
    )
  );

create policy "Users can read own feedback posts"
  on public.feedback_posts
  for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);

create policy "Admins can read feedback posts"
  on public.feedback_posts
  for select
  to authenticated
  using (public.has_admin_permission('view_feedback') or public.has_admin_permission('handle_feedback'));

create policy "Admins can handle feedback posts"
  on public.feedback_posts
  for update
  to authenticated
  using (public.has_admin_permission('handle_feedback'))
  with check (public.has_admin_permission('handle_feedback'));

create policy "Admins can read feedback settings"
  on public.feedback_settings
  for select
  to authenticated
  using (public.has_admin_permission('view_feedback') or public.has_admin_permission('handle_feedback'));

create policy "Admins can manage feedback settings"
  on public.feedback_settings
  for all
  to authenticated
  using (public.has_admin_permission('handle_feedback'))
  with check (public.has_admin_permission('handle_feedback'));

commit;
