alter table public.notifications
  add column if not exists target_type text,
  add column if not exists target_id text,
  add column if not exists action_url text,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists metadata jsonb;

create index if not exists notifications_user_deleted_read_created_idx
  on public.notifications (user_id, deleted_at, read_at, created_at desc);

create index if not exists notifications_target_idx
  on public.notifications (target_type, target_id);

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  body text not null,
  type text not null default 'system',
  target_type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_templates_active_key_idx
  on public.notification_templates (is_active, key);

insert into public.notification_templates (key, title, body, type, target_type, is_active)
values
  (
    'admin_post_deleted',
    '信息已被删除',
    '你的信息已被管理员删除并移入回收站。如有疑问，请联系网站管理员。',
    'content',
    'post',
    true
  ),
  (
    'admin_post_restored',
    '信息已恢复',
    '你的已删除信息已由管理员恢复。当前状态为未上架，如需重新公开显示，请进入我的发布，点击恢复显示或重新上架。',
    'content',
    'post',
    true
  ),
  (
    'admin_post_rejected',
    '信息未通过审核',
    '你的信息未通过审核，请根据提示修改后重新提交。',
    'content',
    'post',
    true
  ),
  (
    'content_issue',
    '内容需要修改',
    '你的信息内容存在问题，请修改后重新提交。',
    'content',
    'post',
    true
  ),
  (
    'image_issue',
    '图片需要修改',
    '你的信息图片存在问题，请更换图片后重新提交。',
    'content',
    'post',
    true
  ),
  (
    'contact_issue',
    '联系方式需要修改',
    '你的联系方式可能不完整或格式不正确，请修改后重新提交。',
    'content',
    'post',
    true
  )
on conflict (key) do update
set
  title = excluded.title,
  body = excluded.body,
  type = excluded.type,
  target_type = excluded.target_type,
  is_active = excluded.is_active,
  updated_at = now();

alter table public.notification_templates enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Users can read own non-deleted notifications" on public.notifications;
create policy "Users can read own non-deleted notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Users can mark or soft delete own notifications" on public.notifications;
create policy "Users can mark or soft delete own notifications"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can manage notification templates" on public.notification_templates;
create policy "Admins can manage notification templates"
  on public.notification_templates
  for all
  to authenticated
  using (public.has_admin_permission('manage_notifications'))
  with check (public.has_admin_permission('manage_notifications'));

revoke insert, delete on public.notifications from anon, authenticated;
revoke update on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at, deleted_at) on public.notifications to authenticated;

revoke all on public.notification_templates from anon, authenticated;
grant select on public.notification_templates to authenticated;
