-- Per-book import restore points, mirroring the standalone ledger: each book
-- keeps the restore point from the last import that touched it. Importing one
-- book no longer overwrites the other books' restore points, and each book is
-- restored independently. The previous single whole-import undo row is
-- retired (existing restore points are dropped once).

create table public.ledger_book_undo(
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('expense','income','remittance')),
  token uuid not null,
  inverse jsonb not null,
  primary key (owner_id, kind)
);
alter table public.ledger_book_undo enable row level security;
create policy read_own_book_undo on public.ledger_book_undo for select to authenticated using (owner_id = (select auth.uid()));
revoke all on public.ledger_book_undo from public, anon, authenticated;
grant select (owner_id, kind, token) on public.ledger_book_undo to authenticated;

create or replace function public.apply_ledger_import(expected_owner uuid, changes jsonb, undo_token uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  prior jsonb;
  inverse_rows jsonb;
  inv jsonb;
  k text;
begin
  if uid is null or uid is distinct from expected_owner then raise exception '请重新登录'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  if undo_token is not null then raise exception '恢复点已变化，请重新打开'; end if;
  if jsonb_typeof(changes) is distinct from 'array' then raise exception '导入格式或数量无效'; end if;
  if jsonb_array_length(changes) = 0 then return; end if;
  select jsonb_agg(jsonb_build_object('id', c->>'id', 'kind', c->>'kind') || coalesce(to_jsonb(e), jsonb_build_object('remove', true)))
    into prior
    from jsonb_array_elements(changes) c
    left join public.personal_ledger_entries e on e.owner_id = uid and e.kind = c->>'kind' and e.id = c->>'id';
  perform public.save_personal_ledger(uid, changes);
  select jsonb_agg(p || jsonb_build_object('expected', e.revision))
    into inverse_rows
    from jsonb_array_elements(prior) p
    left join public.personal_ledger_entries e on e.owner_id = uid and e.kind = p->>'kind' and e.id = p->>'id';
  for k, inv in
    select p->>'kind', jsonb_agg(p) from jsonb_array_elements(inverse_rows) p group by p->>'kind'
  loop
    insert into public.ledger_book_undo values (uid, k, gen_random_uuid(), inv)
    on conflict (owner_id, kind) do update set token = excluded.token, inverse = excluded.inverse;
  end loop;
end $$;

create function public.restore_ledger_book(expected_owner uuid, book text, undo_token uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  inverse_rows jsonb;
begin
  if uid is null or uid is distinct from expected_owner then raise exception '请重新登录'; end if;
  if book is null or book not in ('expense', 'income', 'remittance') then raise exception '账本范围无效'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select u.inverse into inverse_rows
    from public.ledger_book_undo u
    where u.owner_id = uid and u.kind = book and u.token = undo_token;
  if not found then raise exception '恢复点已变化，请重新打开'; end if;
  perform public.save_personal_ledger(uid, inverse_rows);
  delete from public.ledger_book_undo where owner_id = uid and kind = book;
end $$;
revoke all on function public.restore_ledger_book(uuid, text, uuid) from public, anon;
grant execute on function public.restore_ledger_book(uuid, text, uuid) to authenticated;

drop table public.ledger_import_undo;
