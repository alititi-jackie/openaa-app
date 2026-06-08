drop policy if exists "Authors can update active own posts" on public.posts;

create policy "Authors can update active own posts"
  on public.posts
  for update
  to authenticated
  using (
    auth.uid() = author_id
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.status = 'active'
          and posts.status in ('draft', 'pending_review', 'published', 'hidden', 'expired')
      )
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.status = 'restricted'
          and posts.status in ('draft', 'pending_review', 'published', 'expired')
      )
    )
  )
  with check (
    auth.uid() = author_id
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.status = 'active'
          and posts.status in ('draft', 'pending_review', 'published', 'hidden', 'expired', 'deleted')
      )
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.status = 'restricted'
          and posts.status in ('draft', 'pending_review', 'published', 'expired', 'deleted')
      )
    )
  );

create or replace function public.record_post_view(
  p_post_id uuid,
  p_visitor_id text default null,
  p_user_agent text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid;
  safe_visitor_id text;
  actor_key text;
  next_view_count integer;
begin
  if not public.is_public_post(p_post_id) then
    raise exception 'post is not public' using errcode = '42501';
  end if;

  viewer_id := auth.uid();
  safe_visitor_id := nullif(left(btrim(coalesce(p_visitor_id, '')), 80), '');

  if viewer_id is null and safe_visitor_id is null then
    raise exception 'missing view actor' using errcode = '23514';
  end if;

  actor_key := coalesce(viewer_id::text, safe_visitor_id);
  perform pg_advisory_xact_lock(hashtext(p_post_id::text), hashtext(actor_key));

  if exists (
    select 1
    from public.post_views pv
    where pv.post_id = p_post_id
      and pv.created_at >= now() - interval '30 minutes'
      and (
        (viewer_id is not null and pv.user_id = viewer_id)
        or (viewer_id is null and pv.visitor_id = safe_visitor_id)
      )
  ) then
    perform public.refresh_post_stats(p_post_id);

    select ps.view_count
    into next_view_count
    from public.post_stats ps
    where ps.post_id = p_post_id;

    return coalesce(next_view_count, 0);
  end if;

  insert into public.post_views (
    post_id,
    user_id,
    visitor_id,
    user_agent
  )
  values (
    p_post_id,
    viewer_id,
    case when viewer_id is null then safe_visitor_id else null end,
    nullif(left(coalesce(p_user_agent, ''), 500), '')
  );

  perform public.refresh_post_stats(p_post_id);

  select ps.view_count
  into next_view_count
  from public.post_stats ps
  where ps.post_id = p_post_id;

  return coalesce(next_view_count, 0);
end;
$$;

grant execute on function public.record_post_view(uuid, text, text) to anon, authenticated;
