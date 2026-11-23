create function public.ledger_display_mode(expected_owner uuid, requested text, initialize boolean) returns text
language plpgsql security invoker set search_path='' as $$
declare result text;
begin
 if auth.uid() is distinct from expected_owner or auth.uid() is null or requested is null or requested not in ('full','income','expense','remittance') then raise exception '版本或账号无效'; end if;
 if initialize then
 select settings->>'ledger_mode' into result from public.user_settings where user_id=expected_owner;
 if result in ('full','income','expense','remittance') then return result; end if;
 end if;
 insert into public.user_settings as s(user_id,settings) values(expected_owner,jsonb_build_object('ledger_mode',requested))
 on conflict(user_id) do update set settings=s.settings || jsonb_build_object('ledger_mode',case when initialize then coalesce(s.settings->>'ledger_mode',requested) else requested end)
 returning settings->>'ledger_mode' into result;
 return result;
end $$;
create table public.ledger_import_undo(owner_id uuid primary key references auth.users(id) on delete cascade, token uuid not null, inverse jsonb not null);
alter table public.ledger_import_undo enable row level security;
create policy read_own_undo on public.ledger_import_undo for select to authenticated using(owner_id=(select auth.uid()));
revoke all on public.ledger_import_undo from public,anon,authenticated;
grant select(owner_id,token) on public.ledger_import_undo to authenticated;
create function public.apply_ledger_import(expected_owner uuid, changes jsonb, undo_token uuid default null) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); prior jsonb; inverse_rows jsonb;
begin
 if uid is null or uid is distinct from expected_owner then raise exception '请重新登录'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if undo_token is not null then
 select inverse into inverse_rows from public.ledger_import_undo where owner_id=uid and token=undo_token;
 if not found then raise exception '恢复点已变化，请重新打开'; end if;
 perform public.save_personal_ledger(uid,inverse_rows);
 delete from public.ledger_import_undo where owner_id=uid;
 return;
 end if;
 if jsonb_typeof(changes) is distinct from 'array' or jsonb_array_length(changes)>30000 then raise exception '导入格式或数量无效'; end if;
 if jsonb_array_length(changes)=0 then return; end if;
 select jsonb_agg(jsonb_build_object('id',c->>'id','kind',c->>'kind') || coalesce(to_jsonb(e),jsonb_build_object('remove',true))) into prior
 from jsonb_array_elements(changes)c left join public.personal_ledger_entries e on e.owner_id=uid and e.kind=c->>'kind' and e.id=c->>'id';
 perform public.save_personal_ledger(uid,changes);
 select jsonb_agg(p || jsonb_build_object('expected',e.revision)) into inverse_rows from jsonb_array_elements(prior)p left join public.personal_ledger_entries e on e.owner_id=uid and e.kind=p->>'kind' and e.id=p->>'id';
 insert into public.ledger_import_undo values(uid,gen_random_uuid(),inverse_rows) on conflict(owner_id) do update set token=excluded.token,inverse=excluded.inverse;
end $$;
revoke all on function public.ledger_display_mode(uuid,text,boolean),public.apply_ledger_import(uuid,jsonb,uuid) from public,anon;
grant execute on function public.ledger_display_mode(uuid,text,boolean),public.apply_ledger_import(uuid,jsonb,uuid) to authenticated;
