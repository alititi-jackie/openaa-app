begin;

drop table if exists public.feedback cascade;
drop table if exists public.feedback_posts cascade;
drop table if exists public.feedback_settings cascade;

create sequence if not exists public.support_ticket_no_seq;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  type text not null,
  source text not null default 'feedback_page',
  target_type text,
  target_id text,
  related_url text,
  contact_info text,
  content text not null,
  status text not null default 'pending',
  priority text not null default 'normal',
  admin_reply text,
  admin_note text,
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint support_tickets_type_check check (type in ('report_content', 'page_issue', 'contact_issue', 'scam_report', 'feature_suggestion', 'business', 'account', 'other')),
  constraint support_tickets_status_check check (status in ('pending', 'processing', 'replied', 'closed')),
  constraint support_tickets_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint support_tickets_actor_check check (user_id is not null or (visitor_id is not null and length(btrim(visitor_id)) > 0)),
  constraint support_tickets_content_check check (length(btrim(content)) > 0)
);

create table if not exists public.support_ticket_settings (
  key text primary key,
  value text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

insert into public.support_ticket_settings (key, value)
values
  ('enabled', 'true'),
  ('daily_user_limit', '5'),
  ('daily_visitor_limit', '3'),
  ('daily_total_limit', '100'),
  ('content_min_length', '10'),
  ('content_max_length', '3000'),
  ('contact_max_length', '200'),
  ('related_url_max_length', '500')
on conflict (key) do nothing;

insert into public.admin_permissions (permission_key, name, description, category)
values
  ('view_support_tickets', 'View support tickets', 'View support ticket list and details.', 'support'),
  ('handle_support_tickets', 'Handle support tickets', 'Update support ticket status, priority, replies, notes, and settings.', 'support')
on conflict (permission_key) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  is_active = true;

insert into public.admin_role_permissions (role, permission_key, allowed)
select 'admin'::public.admin_role, permission_key, true
from public.admin_permissions
where permission_key in ('view_support_tickets', 'handle_support_tickets')
on conflict (role, permission_key) do update set allowed = excluded.allowed, updated_at = now();

insert into public.admin_role_permissions (role, permission_key, allowed)
select 'support'::public.admin_role, permission_key, true
from public.admin_permissions
where permission_key in ('view_support_tickets', 'handle_support_tickets', 'view_users')
on conflict (role, permission_key) do update set allowed = excluded.allowed, updated_at = now();

insert into public.admin_module_permissions (module_key, permission_key)
values
  ('support', 'view_support_tickets'),
  ('support', 'handle_support_tickets'),
  ('support', 'view_users')
on conflict (module_key, permission_key) do nothing;

delete from public.admin_module_permissions
where module_key = 'messages'
  and permission_key in ('view_feedback', 'handle_feedback');

insert into public.admin_user_modules (user_id, module_key, is_allowed, granted_by)
select ar.user_id, 'support', true, null
from public.admin_roles ar
where ar.is_active = true
  and ar.role in ('admin', 'support')
on conflict (user_id, module_key) do update
set
  is_allowed = true,
  updated_at = now();

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

create index if not exists support_tickets_status_created_idx
  on public.support_tickets (status, created_at desc)
  where deleted_at is null;

create index if not exists support_tickets_type_created_idx
  on public.support_tickets (type, created_at desc)
  where deleted_at is null;

create index if not exists support_tickets_priority_created_idx
  on public.support_tickets (priority, created_at desc)
  where deleted_at is null;

create index if not exists support_tickets_user_created_idx
  on public.support_tickets (user_id, created_at desc)
  where deleted_at is null;

create index if not exists support_tickets_visitor_created_idx
  on public.support_tickets (visitor_id, created_at desc)
  where deleted_at is null;

create index if not exists support_ticket_events_ticket_created_idx
  on public.support_ticket_events (ticket_id, created_at desc);

create or replace function public.set_support_tickets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_support_ticket_no()
returns trigger
language plpgsql
as $$
declare
  next_no bigint;
begin
  if new.ticket_no is null or length(btrim(new.ticket_no)) = 0 then
    next_no := nextval('public.support_ticket_no_seq');
    new.ticket_no := 'ST' || to_char(now(), 'YYYYMMDD') || lpad(next_no::text, 6, '0');
  end if;
  return new;
end;
$$;

create or replace function public.profile_has_support_contact(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and (
        nullif(btrim(coalesce(p.email::text, '')), '') is not null
        or nullif(btrim(coalesce(p.phone, '')), '') is not null
        or nullif(btrim(coalesce(p.wechat_id, '')), '') is not null
        or nullif(btrim(coalesce(p.whatsapp, '')), '') is not null
      )
  );
$$;

drop trigger if exists trg_support_tickets_set_ticket_no on public.support_tickets;
create trigger trg_support_tickets_set_ticket_no
before insert on public.support_tickets
for each row
execute function public.set_support_ticket_no();

drop trigger if exists trg_support_tickets_set_updated_at on public.support_tickets;
create trigger trg_support_tickets_set_updated_at
before update on public.support_tickets
for each row
execute function public.set_support_tickets_updated_at();

alter table public.support_tickets enable row level security;
alter table public.support_ticket_settings enable row level security;
alter table public.support_ticket_events enable row level security;

revoke all on table public.support_tickets from anon, authenticated;
revoke all on table public.support_ticket_settings from anon, authenticated;
revoke all on table public.support_ticket_events from anon, authenticated;

grant usage on sequence public.support_ticket_no_seq to anon, authenticated;

grant insert (user_id, visitor_id, type, source, target_type, target_id, related_url, contact_info, content) on public.support_tickets to anon, authenticated;
grant select on public.support_tickets to authenticated;
grant update (status, priority, admin_reply, admin_note, handled_by, handled_at, closed_at, deleted_at) on public.support_tickets to authenticated;

grant select on public.support_ticket_settings to authenticated;
grant update (value, updated_by, updated_at) on public.support_ticket_settings to authenticated;

grant select on public.support_ticket_events to authenticated;

create policy "Visitors can submit support tickets"
  on public.support_tickets
  for insert
  to anon
  with check (
    user_id is null
    and visitor_id is not null
    and length(btrim(visitor_id)) > 0
    and contact_info is not null
    and length(btrim(contact_info)) > 0
    and content is not null
    and length(btrim(content)) > 0
  );

create policy "Users can submit own support tickets"
  on public.support_tickets
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and content is not null
    and length(btrim(content)) > 0
    and (
      public.profile_has_support_contact(auth.uid())
      or (
        contact_info is not null
        and length(btrim(contact_info)) > 0
      )
    )
  );

create policy "Admins can read support tickets"
  on public.support_tickets
  for select
  to authenticated
  using (deleted_at is null and public.has_admin_permission('view_support_tickets'));

create policy "Admins can handle support tickets"
  on public.support_tickets
  for update
  to authenticated
  using (public.has_admin_permission('handle_support_tickets'))
  with check (public.has_admin_permission('handle_support_tickets'));

create policy "Admins can read support ticket settings"
  on public.support_ticket_settings
  for select
  to authenticated
  using (public.has_admin_permission('view_support_tickets'));

create policy "Admins can manage support ticket settings"
  on public.support_ticket_settings
  for update
  to authenticated
  using (public.has_admin_permission('handle_support_tickets'))
  with check (public.has_admin_permission('handle_support_tickets'));

create policy "Admins can read support ticket events"
  on public.support_ticket_events
  for select
  to authenticated
  using (public.has_admin_permission('view_support_tickets'));

commit;
