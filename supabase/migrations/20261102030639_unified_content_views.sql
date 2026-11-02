begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
-- A single accepted site event feeds both analytics and content counts. Old counts stay intact.
lock table public.site_page_views in share row exclusive mode;
create table public.news_stats (
  news_id uuid primary key references public.news_posts(id) on delete cascade,
  view_count bigint not null default 0 check (view_count >= 0)
);
alter table public.news_stats enable row level security;
revoke all on public.news_stats from public, anon, authenticated;
grant select on public.news_stats to anon, authenticated;
grant all on public.news_stats to service_role;

insert into public.site_settings(key,value,is_public,description)
values ('news_view_display','{"detail":false,"list":false}',true,'新闻前台浏览次数显示；不影响统计及后台显示。')
on conflict (key) do nothing;
create policy "News publishers can update view display" on public.site_settings
for update to authenticated
using (key='news_view_display' and public.has_admin_module('news') and public.has_admin_permission('publish_news'))
with check (key='news_view_display' and is_public=true and public.has_admin_module('news') and public.has_admin_permission('publish_news'));

create policy "News admins can read counts" on public.news_stats for select to authenticated
using (public.has_admin_module('news') and (
 public.has_admin_permission('view_news') or public.has_admin_permission('create_news') or
 public.has_admin_permission('edit_news') or public.has_admin_permission('publish_news') or public.has_admin_permission('delete_news')));
create policy "Public can read enabled published news counts" on public.news_stats for select to anon, authenticated
using (exists(select 1 from public.news_posts n where n.id=news_id and n.status='published' and n.deleted_at is null and (n.published_at is null or n.published_at<=now()))
 and exists(select 1 from public.site_settings s where s.key='news_view_display' and s.is_public and (s.value->'detail'='true'::jsonb or s.value->'list'='true'::jsonb)));

alter table public.site_page_views
 add column post_id uuid references public.posts(id) on delete set null,
 add column news_id uuid references public.news_posts(id) on delete set null;
create index site_page_views_post_idx on public.site_page_views(post_id) where post_id is not null;
create index site_page_views_news_idx on public.site_page_views(news_id) where news_id is not null;
-- Conservative backfill: exact current path, matching title prefix and post-publication timestamps.
-- No historical site PV is added to existing post counts (that would double count).
update public.site_page_views v set news_id=n.id
from public.news_posts n
where v.site='openaa' and v.path='/news/'||n.slug
 and v.created_at>=n.created_at and v.created_at>=coalesce(n.published_at,n.created_at)
 and (v.title=n.title or left(v.title,length(n.title)+3)=n.title||' | ')
 and coalesce(v.user_agent,'') !~* 'bot|crawler|spider|headless|lighthouse|preview';
insert into public.news_stats(news_id,view_count)
 select news_id,count(*) from public.site_page_views where news_id is not null group by news_id;

-- Invoker trigger: only the existing server-side service_role collector can insert page views.
create function public.attribute_content_page_view() returns trigger
language plpgsql security invoker set search_path='' as $$
declare segment text; content_key text;
begin
 new.post_id:=null; new.news_id:=null;
 if new.site<>'openaa' or new.event_id is null then return new; end if;
 segment:=split_part(new.path,'/',2); content_key:=split_part(new.path,'/',3);
 if new.path<>'/'||segment||'/'||content_key or content_key='' then return new; end if;
 if segment='news' then
  select n.id into new.news_id from public.news_posts n
   where n.slug=content_key and n.status='published' and n.deleted_at is null and (n.published_at is null or n.published_at<=now());
 elsif segment in ('jobs','housing','marketplace','services') and content_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
  select p.id into new.post_id from public.posts p join public.cities c on c.id=p.city_id
   where p.id=content_key::uuid and c.slug='ny' and public.is_public_post(p.id)
    and p.post_type=case segment when 'jobs' then 'job' when 'housing' then 'housing' when 'marketplace' then 'marketplace' else 'service' end::public.post_type;
 end if;
 return new;
end $$;
revoke all on function public.attribute_content_page_view() from public,anon,authenticated;
grant execute on function public.attribute_content_page_view() to service_role;
create trigger attribute_content_page_view before insert on public.site_page_views
 for each row execute function public.attribute_content_page_view();

-- AFTER INSERT means ON CONFLICT DO NOTHING and retries cannot increment twice.
create function public.count_content_page_view() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.post_id is not null then
  perform pg_advisory_xact_lock(hashtext('content-view'),hashtext(new.post_id::text));
  insert into public.post_views(id,post_id,user_id,visitor_id,user_agent,created_at)
   values(new.id,new.post_id,new.user_id,case when new.user_id is null then new.visitor_id else null end,new.user_agent,new.created_at);
  -- Existing post_views trigger refreshes post_stats; favorites/reports continue to use that same source.
 elsif new.news_id is not null then
  insert into public.news_stats(news_id,view_count) values(new.news_id,1)
   on conflict(news_id) do update set view_count=public.news_stats.view_count+1;
 end if;
 return new;
end $$;
revoke all on function public.count_content_page_view() from public,anon,authenticated;
grant execute on function public.count_content_page_view() to service_role;
create trigger count_content_page_view after insert on public.site_page_views
 for each row execute function public.count_content_page_view();

-- Keep old tabs compatible, but retire their write path atomically with the new trigger.
create or replace function public.record_post_view(p_post_id uuid,p_visitor_id text default null,p_user_agent text default null)
returns integer language sql security invoker set search_path='' as $$
 select coalesce((select view_count from public.post_stats where post_id=p_post_id and public.is_public_post(p_post_id)),0);
$$;
revoke insert,update,delete on public.post_views from anon,authenticated;
comment on function public.record_post_view(uuid,text,text) is 'Compatibility read only. Accepted site_page_views events are the sole source of new post views.';
comment on table public.news_stats is 'Cumulative page views, not unique people. Frontend display switches do not stop collection.';
insert into public.site_settings(key,value,is_public,description)
values('content_views_pv_cutover',jsonb_build_object('at',now(),'rule','one accepted page event per view'),false,'保留旧帖子数量，从此时起按 PV 累计。');
commit;
