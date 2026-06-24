-- Bring the new-site notification tables back in line with the app code.
-- This migration keeps existing notification template rows and does not import
-- old real user notifications.

alter table public.notification_templates
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists type text default 'system',
  add column if not exists target_type text,
  add column if not exists created_at timestamptz default now();

update public.notification_templates
set
  id = coalesce(id, gen_random_uuid()),
  type = coalesce(nullif(type, ''), nullif(metadata ->> 'type', ''), 'system'),
  target_type = coalesce(nullif(target_type, ''), nullif(metadata ->> 'target_type', '')),
  created_at = coalesce(created_at, updated_at, now())
where id is null
  or type is null
  or type = ''
  or target_type is null
  or created_at is null;

alter table public.notification_templates
  alter column id set not null,
  alter column type set not null,
  alter column created_at set not null;

create unique index if not exists notification_templates_id_uidx
  on public.notification_templates (id);

create unique index if not exists notification_templates_key_uidx
  on public.notification_templates (key);

create index if not exists notification_templates_active_key_idx
  on public.notification_templates (is_active, key);

create index if not exists notification_templates_target_idx
  on public.notification_templates (target_type, is_active, key);

alter table public.notifications
  add column if not exists link_url text,
  add column if not exists data jsonb default '{}'::jsonb,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

update public.notifications
set
  link_url = coalesce(link_url, action_url),
  data = coalesce(data, metadata, '{}'::jsonb),
  is_read = case when read_at is not null then true else is_read end
where link_url is null
  or data is null
  or (read_at is not null and is_read = false);

alter table public.notifications
  alter column data set default '{}'::jsonb,
  alter column data set not null;

create index if not exists notifications_user_deleted_read_at_created_idx
  on public.notifications (user_id, deleted_at, read_at, created_at desc);

create index if not exists notifications_created_by_idx
  on public.notifications (created_by, created_at desc);

insert into public.notification_templates (key, title, body, type, target_type, is_active, metadata)
values
  (
    'admin_post_hidden',
    '发布信息已下架',
    '你的发布信息因不符合平台展示要求，已暂时下架。请进入个人中心查看并按提示修改。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'admin_post_deleted',
    '发布信息已删除',
    '你的发布信息因不符合平台规则或收到有效反馈，已被平台移除。如有疑问，请联系网站管理员。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'admin_post_restored',
    '发布信息已恢复',
    '你的发布信息已恢复，可在个人中心查看。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'admin_post_published',
    '发布信息已通过',
    '你的发布信息已通过审核并恢复展示，可在个人中心查看。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'admin_post_rejected',
    '发布信息未通过审核',
    '你的发布信息暂未通过审核，请进入个人中心查看并根据提示修改后重新提交。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'wrong_category',
    '分类需要修改',
    '你的发布信息分类可能选择不正确，请重新选择合适的分类后再提交。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'content_issue',
    '内容需要修改',
    '你的发布信息内容需要调整，请进入个人中心查看并修改后重新提交。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'image_issue',
    '图片需要修改',
    '你的发布信息图片需要调整，请更换合适图片后重新提交。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'contact_issue',
    '联系方式需要修改',
    '你的发布信息联系方式可能不完整或格式不正确，请修改后重新提交。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'missing_info',
    '信息需要补充',
    '你的发布信息内容不够完整，请补充必要信息后重新提交。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'duplicate_post',
    '重复发布提醒',
    '你的发布信息可能存在重复内容，请保留一条有效信息，避免影响展示。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'report_result',
    '举报处理结果',
    '你提交或相关的举报已有处理结果，请进入个人中心查看详情。',
    'content',
    'post',
    true,
    '{"type":"content","target_type":"post"}'::jsonb
  ),
  (
    'support_ticket_reply',
    '反馈已回复',
    '你提交的线索或建议已有回复，请进入个人中心查看详情。',
    'support',
    'support_ticket',
    true,
    '{"type":"support","target_type":"support_ticket"}'::jsonb
  ),
  (
    'system_announcement',
    '平台通知',
    '这是一条平台通知，请进入通知中心查看详情。',
    'system',
    null,
    true,
    '{"type":"system","target_type":null}'::jsonb
  ),
  (
    'account_notice',
    '账号提醒',
    '你的账号或资料需要注意，请进入个人中心查看并处理。',
    'account',
    'profile',
    true,
    '{"type":"account","target_type":"profile"}'::jsonb
  )
on conflict (key) do update
set
  title = excluded.title,
  body = excluded.body,
  type = excluded.type,
  target_type = excluded.target_type,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();

drop policy if exists "Users can mark own notifications" on public.notifications;
drop policy if exists "Admins can manage notification templates" on public.notification_templates;

create policy "Admins can manage notification templates"
  on public.notification_templates
  for all
  using (public.has_admin_module('messages'))
  with check (public.has_admin_module('messages'));

revoke insert on public.notifications from anon, authenticated;
revoke update on public.notifications from anon, authenticated;
revoke delete on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant select on public.notification_templates to authenticated;
