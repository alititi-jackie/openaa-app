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
    where created_at >= p_seven_day_start
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
