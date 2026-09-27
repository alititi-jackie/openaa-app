-- Apply before deploying code that calls consume_rate_limit.
-- The unique key on (actor_id, action, window_start) serializes concurrent updates.
create or replace function public.consume_rate_limit(
  p_actor_id text,
  p_action text,
  p_limit integer,
  p_window_start timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_actor_id is null or length(p_actor_id) = 0 or p_limit < 1 or p_window_start is null then
    return false;
  end if;

  insert into public.rate_limits (actor_id, action, window_start, count, metadata)
  values (p_actor_id, p_action, p_window_start, 1, coalesce(p_metadata, '{}'::jsonb))
  on conflict (actor_id, action, window_start) do update
    set count = public.rate_limits.count + 1, updated_at = now()
    where public.rate_limits.count < p_limit
  returning count into v_count;

  return v_count is not null;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, timestamptz, jsonb) to service_role;
