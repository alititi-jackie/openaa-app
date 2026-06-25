create or replace function public.refresh_post_stats(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.posts where id = p_post_id) then
    delete from public.post_stats where post_id = p_post_id;
    return;
  end if;

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
    (
      select count(*)::integer
      from public.user_favorites
      where target_type in ('job', 'housing', 'marketplace', 'service', 'post')
        and target_id = p_post_id::text
    ),
    (
      select count(*)::integer
      from public.post_reports
      where post_id = p_post_id
        and deleted_at is null
    ),
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

comment on function public.refresh_post_stats(uuid) is
  'Refreshes aggregate post stats and safely skips posts that were removed during cascading deletes.';
