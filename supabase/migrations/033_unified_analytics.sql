begin;
alter table public.site_page_views
  add column site text not null default 'openaa' check (site in ('openaa','dmv','tools','go')),
  add column event_id uuid,
  add column country text,
  add column region text,
  add column browser text,
  add column operating_system text;
create unique index site_page_views_event_idx on public.site_page_views (site, event_id) where event_id is not null;
create index site_page_views_site_created_idx on public.site_page_views (site, created_at desc);
comment on column public.site_page_views.referrer is 'New collector stores only referring hostname. Legacy rows may contain a URL.';

create or replace function public.get_unified_analytics(p_site text default null, p_period text default '7')
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  today date := (now() at time zone 'America/New_York')::date;
  first_day date;
  end_day date;
  result jsonb;
begin
  if not public.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  if p_site is not null and p_site not in ('openaa','dmv','tools','go') then raise exception 'Invalid site'; end if;
  if p_period is null or p_period not in ('today','yesterday','7','30') then raise exception 'Invalid period'; end if;
  first_day := case p_period when 'today' then today when 'yesterday' then today - 1 when '7' then today - 6 else today - 29 end;
  end_day := case when p_period = 'yesterday' then today else today + 1 end;
  with views as materialized (
    select site, path, title, created_at, country, region, device_type, browser, operating_system,
      site || ':' || case when visitor_id is not null then 'v:' || visitor_id else 'u:' || user_id::text end as actor,
      (created_at at time zone 'America/New_York')::date as day,
      coalesce(nullif(regexp_replace(split_part(split_part(referrer, '?', 1), '#', 1), '^https?://([^/]+).*$', '\1'), ''), '直接访问 / 未知') as source
    from public.site_page_views
    where created_at >= (first_day::timestamp at time zone 'America/New_York')
      and created_at < least(now(), end_day::timestamp at time zone 'America/New_York')
      and (p_site is null or site = p_site)
  ), daily as (
    select day, count(*) as views, count(distinct actor) as visitors from views group by day
  ), calendar as (
    select first_day + n as day from generate_series(0, end_day - first_day - 1) as n
  ), pages as (
    select site, path, max(title) as title, count(*) as views, count(distinct actor) as visitors
    from views group by site, path order by count(*) desc, site, path limit 50
  ), sites as (
    select site as label, count(*) as views, count(distinct actor) as visitors from views group by site order by count(*) desc
  ), dimensions as (
    select 'sources' as dimension, source as label, count(*) as views from views group by source
    union all select 'devices', coalesce(device_type, '未知'), count(*) from views group by device_type
    union all select 'countries', coalesce(country, '未知'), count(*) from views group by country
    union all select 'regions', coalesce(country || ' / ' || region, '未知'), count(*) from views group by country, region
    union all select 'browsers', coalesce(browser, '未知'), count(*) from views group by browser
    union all select 'systems', coalesce(operating_system, '未知'), count(*) from views group by operating_system
  ), ranked as (
    select *, row_number() over (partition by dimension order by views desc, label) as rank from dimensions
  ), grouped as (
    select dimension, jsonb_agg(jsonb_build_object('label',label,'views',views) order by views desc, label) as items
    from ranked where rank <= 20 group by dimension
  )
  select jsonb_build_object(
    'views', (select count(*) from views), 'visitors', (select count(distinct actor) from views),
    'startDate', first_day, 'endDate', end_day - 1,
    'daily', (select jsonb_agg(jsonb_build_object('day', c.day, 'views', coalesce(d.views,0), 'visitors',coalesce(d.visitors,0)) order by c.day) from calendar c left join daily d using(day)),
    'pages', coalesce((select jsonb_agg(to_jsonb(p) order by views desc, site, path) from pages p),'[]'::jsonb),
    'sites', coalesce((select jsonb_agg(to_jsonb(s) order by views desc, label) from sites s),'[]'::jsonb),
    'dimensions', coalesce((select jsonb_object_agg(dimension,items) from grouped),'{}'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_unified_analytics(text,text) from public, anon;
grant execute on function public.get_unified_analytics(text,text) to authenticated;

-- Preserve the existing dashboard's main-site-only meaning after subsites connect.
-- Aggregate within Postgres so the admin dashboard never transfers raw page views.
create or replace function public.get_site_analytics_summary(
  p_today_start timestamptz,
  p_seven_day_start timestamptz,
  p_active_since timestamptz
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with views as (
    select path, title, user_id, visitor_id, created_at,
      case when user_id is not null then 'u:' || user_id::text
           when visitor_id is not null then 'v:' || visitor_id end as actor
    from public.site_page_views
    where site = 'openaa' and created_at >= p_seven_day_start
  ),
  totals as (
    select count(*) filter (where created_at >= p_today_start) as today_views,
      count(distinct actor) filter (where created_at >= p_today_start) as today_visitors,
      count(distinct actor) filter (where created_at >= p_active_since) as active_visitors,
      count(distinct actor) as seven_day_visitors
    from views
  ),
  popular as (
    select path, (array_agg(title order by created_at desc) filter (where title is not null))[1] as title,
      count(*) as views, count(distinct actor) as visitors, max(created_at) as last_viewed_at
    from views
    where path not like '/admin%' and path not like '/api%' and path not like '/_next%'
    group by path
    order by count(*) desc, count(distinct actor) desc
    limit 10
  )
  select jsonb_build_object(
    'todayViews', (select today_views from totals),
    'todayVisitors', (select today_visitors from totals),
    'activeVisitors', (select active_visitors from totals),
    'sevenDayVisitors', (select seven_day_visitors from totals),
    'popularPages', coalesce((select jsonb_agg(jsonb_build_object(
      'path', path, 'title', title, 'views', views, 'visitors', visitors,
      'lastViewedAt', last_viewed_at
    )) from popular), '[]'::jsonb)
  );
$$;

revoke all on function public.get_site_analytics_summary(timestamptz, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_site_analytics_summary(timestamptz, timestamptz, timestamptz) to authenticated;

commit;
