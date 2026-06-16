begin;

alter table public.post_reports
  add column if not exists contact_info text,
  add column if not exists related_url text,
  add column if not exists post_action text,
  add column if not exists admin_reason text,
  add column if not exists admin_message_editable text,
  add column if not exists admin_message_fixed text,
  add column if not exists notify_author boolean not null default true,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

alter table public.post_reports
  drop constraint if exists post_reports_post_action_check,
  add constraint post_reports_post_action_check check (post_action is null or post_action in ('none', 'hide', 'delete'));

drop index if exists public.post_reports_reporter_post_uidx;

create unique index if not exists post_reports_open_reporter_post_uidx
  on public.post_reports (reporter_id, post_id)
  where reporter_id is not null
    and deleted_at is null
    and status in ('open', 'in_review');

create unique index if not exists post_reports_open_visitor_post_uidx
  on public.post_reports (visitor_id, post_id)
  where visitor_id is not null
    and deleted_at is null
    and status in ('open', 'in_review');

create index if not exists post_reports_deleted_created_idx
  on public.post_reports (deleted_at desc)
  where deleted_at is not null;

create index if not exists post_reports_post_status_created_idx
  on public.post_reports (post_id, status, created_at desc)
  where deleted_at is null;

alter table public.support_tickets
  drop constraint if exists support_tickets_type_check,
  drop constraint if exists support_tickets_status_check,
  drop constraint if exists support_tickets_priority_check;

update public.support_tickets
set
  type = case
    when type = 'business' then 'business'
    when type = 'feature_suggestion' then 'feature_suggestion'
    when type = 'other' then 'other'
    else 'other'
  end,
  status = case
    when status = 'pending' then 'new'
    when status in ('processing', 'replied', 'closed') then 'viewed'
    when status in ('new', 'viewed', 'deleted') then status
    else 'new'
  end;

alter table public.support_tickets
  add constraint support_tickets_type_check check (type in ('business', 'news_tip', 'feature_suggestion', 'other', 'admin_reply')),
  add constraint support_tickets_status_check check (status in ('new', 'viewed', 'deleted'));

create index if not exists support_tickets_deleted_created_idx
  on public.support_tickets (deleted_at desc)
  where deleted_at is not null;

drop policy if exists "Admins can read support tickets" on public.support_tickets;
create policy "Messages admins can read support tickets"
  on public.support_tickets
  for select
  to authenticated
  using (
    public.has_admin_module('messages')
    or (deleted_at is not null and public.has_admin_module('recycle-bin'))
  );

drop policy if exists "Admins can handle support tickets" on public.support_tickets;
create policy "Messages admins can handle support tickets"
  on public.support_tickets
  for update
  to authenticated
  using (public.has_admin_module('messages') or public.has_admin_module('recycle-bin'))
  with check (public.has_admin_module('messages') or public.has_admin_module('recycle-bin'));

drop policy if exists "Admins can read post reports" on public.post_reports;
create policy "Messages admins can read post reports"
  on public.post_reports
  for select
  to authenticated
  using (
    public.has_admin_module('messages')
    or (deleted_at is not null and public.has_admin_module('recycle-bin'))
  );

drop policy if exists "Admins can manage post reports" on public.post_reports;
create policy "Messages admins can manage post reports"
  on public.post_reports
  for update
  to authenticated
  using (public.has_admin_module('messages') or public.has_admin_module('recycle-bin'))
  with check (public.has_admin_module('messages') or public.has_admin_module('recycle-bin'));

insert into public.top_quick_links (key, title, href, icon, sort_order, is_active)
values ('feedback', '线索与建议', '/feedback', 'message-square', 80, true)
on conflict (key) do update
set
  title = excluded.title,
  href = excluded.href,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

commit;
