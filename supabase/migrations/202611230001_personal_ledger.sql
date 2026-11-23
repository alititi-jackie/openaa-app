create table public.personal_ledger_entries (
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 kind text not null check(kind in ('expense','income','remittance')),
 id text not null check(length(id) between 1 and 200),
 date date not null,
 amount numeric(16,2) not null,
 method text,
 category text,
 cny numeric(16,2),
 rate numeric(20,10),
 note text not null default '' check(length(note)<=10000),
 revision uuid not null default gen_random_uuid(),
 created_at timestamptz not null default now(),
 primary key(owner_id,kind,id),
 check (case when kind='remittance' then method is null and category is null and cny is not null and rate is not null and (rate>0 or (rate=0 and amount=0 and cny=0)) and amount*cny>=0
 else amount>=0 and method is not null and method in ('cash','card') and rate is null and cny is null and (case when kind='expense' then category is not null and length(category) between 1 and 100 else category is null end) end)
);
create index personal_ledger_by_date on public.personal_ledger_entries(owner_id,date desc,created_at desc);
alter table public.personal_ledger_entries enable row level security;
create policy own_ledger on public.personal_ledger_entries for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
revoke all on public.personal_ledger_entries from public, anon, authenticated;
grant select on public.personal_ledger_entries to authenticated;

-- The single write entry point binds every statement to the current identity.
create function public.save_personal_ledger(expected_owner uuid, changes jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); r record;
begin
 if uid is null or uid is distinct from expected_owner then raise exception '请重新登录'; end if;
 if jsonb_typeof(changes) is distinct from 'array' or jsonb_array_length(changes)>30000 then raise exception '导入格式或数量无效'; end if;
 for r in select * from jsonb_to_recordset(changes) as x(id text,kind text,date date,amount numeric,method text,category text,cny numeric,rate numeric,note text,expected uuid,remove boolean)
 loop
 if r.remove is true then
  delete from public.personal_ledger_entries where owner_id=uid and kind=r.kind and id=r.id and revision=r.expected;
 elsif r.expected is null then
  insert into public.personal_ledger_entries(owner_id,id,kind,date,amount,method,category,cny,rate,note) values(uid,r.id,r.kind,r.date,r.amount,r.method,r.category,r.cny,r.rate,coalesce(r.note,'')) on conflict do nothing;
 else
  update public.personal_ledger_entries set date=r.date,amount=r.amount,method=r.method,category=r.category,cny=r.cny,rate=r.rate,note=coalesce(r.note,''),revision=gen_random_uuid() where owner_id=uid and kind=r.kind and id=r.id and revision=r.expected;
 end if;
 if not found then raise exception '账目已变化，请重新查看后再保存'; end if;
 end loop;
end $$;
revoke all on function public.save_personal_ledger(uuid,jsonb) from public,anon;
grant execute on function public.save_personal_ledger(uuid,jsonb) to authenticated;
