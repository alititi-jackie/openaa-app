create or replace function public.ledger_page(expected_owner uuid, book text, start_day date, end_day date, category_filter text, term text, page_offset int, page_size int)
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
 'years',coalesce((select jsonb_agg(y order by y desc) from (select distinct to_char(date,'YYYY') y from public.personal_ledger_entries where owner_id=auth.uid() and owner_id=expected_owner and (book='summary' or kind=book)) ys),'[]'),
 'periods',coalesce((select jsonb_agg(to_jsonb(v) order by period desc) from (
 select to_char(date,case when start_day is null then 'YYYY' else 'YYYY-MM' end) as period,count(*) as count,
 sum(case when book='summary' and kind<>'income' then -amount else amount end) as amount from filtered where page_size=0 group by 1)v),'[]'),
 'groups',coalesce((select jsonb_object_agg(kind,to_jsonb(g)-'kind') from
 (select kind,count(*) as count,sum(amount) as amount,coalesce(sum(cny),0) as cny,sum(abs(amount)) as abs_usd,coalesce(sum(abs(cny)),0) as abs_cny,
 coalesce(sum(amount) filter(where method='cash'),0) as cash,coalesce(sum(amount) filter(where method='card'),0) as card from filtered group by kind)g),'{}'));
$$;
revoke all on function public.ledger_page(uuid,text,date,date,text,text,int,int) from public,anon;
grant execute on function public.ledger_page(uuid,text,date,date,text,text,int,int) to authenticated;
