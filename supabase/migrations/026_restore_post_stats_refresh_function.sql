create or replace function public.refresh_post_stats(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.post_stats (
    post_id,
    view_count,
    favorite_count,
    report_count,
    updated_at
  )
  values (
    p_post_id,
    (select count(*)::integer from public.post_views where post_id = p_post_id),
    (select count(*)::integer from public.post_favorites where post_id = p_post_id),
    (select count(*)::integer from public.post_reports where post_id = p_post_id),
    now()
  )
  on conflict (post_id)
  do update set
    view_count = excluded.view_count,
    favorite_count = excluded.favorite_count,
    report_count = excluded.report_count,
    updated_at = now();
end;
$$;
