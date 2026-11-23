-- Every writer uses the same per-account transaction lock. Large writes stay atomic.
alter function public.save_personal_ledger(uuid,jsonb) rename to ledger_write_batch;
revoke all on function public.ledger_write_batch(uuid,jsonb) from public,anon,authenticated;

create function public.save_personal_ledger(expected_owner uuid, changes jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare batch jsonb;
begin
 if auth.uid() is null or expected_owner is distinct from auth.uid() then raise exception '请重新登录'; end if;
 perform pg_advisory_xact_lock(hashtextextended(expected_owner::text,0));
 if jsonb_typeof(changes) is distinct from 'array' then raise exception '导入格式无效'; end if;
 for batch in select jsonb_agg(value order by ord) from jsonb_array_elements(changes) with ordinality x(value,ord)
 group by (ord-1)/500 order by (ord-1)/500 loop
   perform public.ledger_write_batch(expected_owner,batch);
 end loop;
end $$;
revoke all on function public.save_personal_ledger(uuid,jsonb) from public,anon;
grant execute on function public.save_personal_ledger(uuid,jsonb) to authenticated;
create or replace function public.apply_ledger_import(expected_owner uuid, changes jsonb, undo_token uuid default null) returns void
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
 if jsonb_typeof(changes) is distinct from 'array' then raise exception '导入格式或数量无效'; end if;
 if jsonb_array_length(changes)=0 then return; end if;
 select jsonb_agg(jsonb_build_object('id',c->>'id','kind',c->>'kind') || coalesce(to_jsonb(e),jsonb_build_object('remove',true))) into prior
 from jsonb_array_elements(changes)c left join public.personal_ledger_entries e on e.owner_id=uid and e.kind=c->>'kind' and e.id=c->>'id';
 perform public.save_personal_ledger(uid,changes);
 select jsonb_agg(p || jsonb_build_object('expected',e.revision)) into inverse_rows from jsonb_array_elements(prior)p left join public.personal_ledger_entries e on e.owner_id=uid and e.kind=p->>'kind' and e.id=p->>'id';
 insert into public.ledger_import_undo values(uid,gen_random_uuid(),inverse_rows) on conflict(owner_id) do update set token=excluded.token,inverse=excluded.inverse;
end $$;

create function public.commit_ledger_scope(expected_owner uuid, books text[], seen uuid[], changes jsonb, clearing boolean)
returns void language plpgsql security definer set search_path='' as $$
declare current_versions uuid[];
begin
 if auth.uid() is null or expected_owner is distinct from auth.uid() then raise exception '请重新登录'; end if;
 if books is null or cardinality(books)=0 or not books <@ array['expense','income','remittance'] then raise exception '账本范围无效'; end if;
 perform pg_advisory_xact_lock(hashtextextended(expected_owner::text,0));
 select coalesce(array_agg(revision order by revision),'{}') into current_versions from public.personal_ledger_entries where owner_id=expected_owner and kind=any(books);
 if current_versions is distinct from array(select unnest(seen) order by 1) then raise exception '账目已变化，请重新打开清空确认框或重新选择导入文件。'; end if;
 if clearing then
   delete from public.personal_ledger_entries where owner_id=expected_owner and kind=any(books);
 else
   if exists(select 1 from jsonb_array_elements(changes)c where (c->>'kind'=any(books)) is not true) then raise exception '操作超出所选账本'; end if;
   perform public.apply_ledger_import(expected_owner,changes);
 end if;
end $$;
revoke all on function public.commit_ledger_scope(uuid,text[],uuid[],jsonb,boolean) from public,anon;
grant execute on function public.commit_ledger_scope(uuid,text[],uuid[],jsonb,boolean) to authenticated;

create function public.ledger_page(expected_owner uuid, book text, start_day date, end_day date, category_filter text, term text, page_offset int, page_size int)
returns jsonb language sql stable security invoker set search_path='' as $$
 with filtered as (
 select e.* from public.personal_ledger_entries e
 where owner_id=auth.uid() and owner_id=expected_owner and (book='summary' or kind=book)
 and (start_day is null or date>=start_day) and (end_day is null or date<end_day)
 and (category_filter is null or category=category_filter)
 and (term='' or (left(term,1) not in ('$','¥','￥') and strpos(lower(note),lower(term))>0)
 or (regexp_replace(replace(term,',',''),'^[＄$¥￥]','')<>'' and (
 (left(term,1) not in ('¥','￥') and strpos(amount::text,regexp_replace(replace(term,',',''),'^[＄$¥￥]',''))>0)
 or (left(term,1)<>'$' and strpos(cny::text,regexp_replace(replace(term,',',''),'^[＄$¥￥]',''))>0)))))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(p)-'owner_id' order by date desc,created_at desc,kind,id) from
 (select * from filtered order by date desc,created_at desc,kind,id limit least(greatest(page_size,0),30) offset greatest(page_offset,0))p),'[]'),
 'groups',coalesce((select jsonb_object_agg(kind,to_jsonb(g)-'kind') from
 (select kind,count(*) as count,sum(amount) as amount,coalesce(sum(cny),0) as cny,sum(abs(amount)) as abs_usd,coalesce(sum(abs(cny)),0) as abs_cny,
 coalesce(sum(amount) filter(where method='cash'),0) as cash,coalesce(sum(amount) filter(where method='card'),0) as card from filtered group by kind)g),'{}'));
$$;
revoke all on function public.ledger_page(uuid,text,date,date,text,text,int,int) from public,anon;
grant execute on function public.ledger_page(uuid,text,date,date,text,text,int,int) to authenticated;
