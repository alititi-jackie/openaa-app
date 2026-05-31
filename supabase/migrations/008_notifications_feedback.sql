create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link_url text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_read_created_idx
  on public.notifications (user_id, read_at, created_at desc);

create table if not exists public.system_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email citext,
  category text,
  subject text not null,
  message text not null,
  status public.feedback_status not null default 'open',
  admin_note text,
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_status_created_idx
  on public.feedback (status, created_at desc);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.system_announcements enable row level security;
alter table public.feedback enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Users can read own notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can manage notifications"
  on public.notifications
  for all
  to authenticated
  using (public.has_admin_permission('manage_notifications'))
  with check (public.has_admin_permission('manage_notifications'));

create policy "Public can read active system announcements"
  on public.system_announcements
  for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "Admins can manage system announcements"
  on public.system_announcements
  for all
  to authenticated
  using (public.has_admin_permission('manage_system_announcements'))
  with check (public.has_admin_permission('manage_system_announcements'));

create policy "Users and visitors can submit feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  );

create policy "Users can read own feedback"
  on public.feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage feedback"
  on public.feedback
  for all
  to authenticated
  using (public.has_admin_permission('view_feedback') or public.has_admin_permission('handle_feedback'))
  with check (public.has_admin_permission('handle_feedback'));

create policy "Users can manage own push subscriptions"
  on public.push_subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can read push subscriptions"
  on public.push_subscriptions
  for select
  to authenticated
  using (public.has_admin_permission('manage_notifications'));
