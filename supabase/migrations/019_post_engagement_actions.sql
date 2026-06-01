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

create or replace function public.refresh_post_stats_from_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid;
begin
  target_post_id := coalesce(new.post_id, old.post_id);

  if target_post_id is not null then
    perform public.refresh_post_stats(target_post_id);
  end if;

  return coalesce(new, old);
end;
$$;

with ranked_reports as (
  select
    ctid,
    row_number() over (
      partition by reporter_id, post_id
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.post_reports
  where reporter_id is not null
)
delete from public.post_reports pr
using ranked_reports ranked
where pr.ctid = ranked.ctid
  and ranked.duplicate_rank > 1;

create unique index if not exists post_reports_reporter_post_uidx
  on public.post_reports (reporter_id, post_id)
  where reporter_id is not null;

drop trigger if exists refresh_post_stats_after_favorite on public.post_favorites;
create trigger refresh_post_stats_after_favorite
after insert or delete on public.post_favorites
for each row execute function public.refresh_post_stats_from_row();

drop trigger if exists refresh_post_stats_after_view on public.post_views;
create trigger refresh_post_stats_after_view
after insert or delete on public.post_views
for each row execute function public.refresh_post_stats_from_row();

drop trigger if exists refresh_post_stats_after_report on public.post_reports;
create trigger refresh_post_stats_after_report
after insert or update or delete on public.post_reports
for each row execute function public.refresh_post_stats_from_row();

drop policy if exists "Users can manage own favorites" on public.post_favorites;
create policy "Users can manage own favorites"
  on public.post_favorites
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and public.is_public_post(post_id));

drop policy if exists "Users and anonymous visitors can insert post views" on public.post_views;
create policy "Users and anonymous visitors can insert post views"
  on public.post_views
  for insert
  to anon, authenticated
  with check (
    public.is_public_post(post_id)
    and (
      (auth.uid() is not null and auth.uid() = user_id)
      or (auth.uid() is null and user_id is null and visitor_id is not null)
    )
  );

drop policy if exists "Users and visitors can submit post reports" on public.post_reports;
create policy "Users can submit post reports"
  on public.post_reports
  for insert
  to authenticated
  with check (auth.uid() = reporter_id and public.is_public_post(post_id));
