import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;
create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select current_setting('request.jwt.claim.sub',true)::uuid$$;
grant usage on schema auth to anon, authenticated;`);
await db.exec(
  await readFile(
    new URL(
      "../../supabase/migrations/202611230001_personal_ledger.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
await db.exec("create table public.user_settings(user_id uuid primary key,settings jsonb not null);grant select,insert,update on public.user_settings to authenticated");
await db.exec(await readFile(new URL("../../supabase/migrations/202611230002_ledger_preferences_and_imports.sql",import.meta.url),"utf8"));
await db.exec(await readFile(new URL("../../supabase/migrations/202611230003_ledger_review.sql",import.meta.url),"utf8"));
const a = crypto.randomUUID(),
  b = crypto.randomUUID();
await db.query("insert into auth.users values($1),($2)", [a, b]);
await db.exec("set role authenticated");
const login = (id) =>
  db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
const save = (id, changes) =>
  db.query("select public.save_personal_ledger($1,$2)", [
    id,
    JSON.stringify(changes),
  ]);
const list = async () =>
  (await db.query("select * from public.personal_ledger_entries")).rows;
const row = {
  id: "test",
  kind: "expense",
  date: "2026-11-23",
  amount: 58.96,
  category: "餐饮",
  method: "cash",
};
await login(a);
await save(a, [row]);
const [old] = await list();
await login(b);
assert.equal((await list()).length, 0);
await assert.rejects(save(a, [row]));
await assert.rejects(
  save(b, [{ ...row, expected: old.revision, remove: true }]),
);
await login(a);
await save(a, [{ ...row, amount: 60, expected: old.revision }]);
await assert.rejects(
  save(a, [
    { ...row, id: "rollback" },
    { ...row, expected: old.revision },
  ]),
);
assert.equal((await list()).length, 1);
assert.equal(Number((await list())[0].amount), 60);
const apply=(changes,token=null)=>db.query("select public.apply_ledger_import($1,$2,$3)",[a,JSON.stringify(changes),token]);
const mode=async(value,initialize)=>(await db.query("select public.ledger_display_mode($1,$2,$3) as mode",[a,value,initialize])).rows[0].mode;
assert.equal(await mode("income",true),"income");
assert.equal(await mode("full",true),"income");
assert.equal(await mode("expense",false),"expense");
const token=async()=>(await db.query("select token from public.ledger_import_undo")).rows[0].token;
await apply([{...row,id:"new"}]);await apply([],await token());assert.equal((await list()).length,1);
const current=(await list())[0];
await apply([{...current,expected:current.revision,remove:true}]);assert.equal((await list()).length,0);
await apply([],await token());assert.equal((await list()).length,1);
await apply([{...row,id:"new"}]);const imported=(await list()).find(r=>r.id==="new");
await save(a,[{...imported,amount:5,expected:imported.revision}]);await assert.rejects(apply([],await token()));
const page = async (offset,size,term) => (await db.query("select public.ledger_page($1,'expense',null,null,null,$2,$3,$4) as page",[a,term,offset,size])).rows[0].page;
const searchRow = {...row, id:"search-1",note:"周末买菜",amount:58.96};
await save(a,[searchRow,{...searchRow,id:"search-2"}]);
assert.equal((await page(0,1,"58")).groups.expense.count,2);
assert.equal((await page(0,1,"买菜")).groups.expense.amount,117.92);
assert.notEqual((await page(0,1,"买菜")).rows[0].id,(await page(1,1,"买菜")).rows[0].id);
const seen=(await list()).map(r=>r.revision);
await save(a,[{...row,id:"after-preview"}]);
for (const clearing of [true,false]) await assert.rejects(db.query("select public.commit_ledger_scope($1,array['expense'],$2,'[]',$3)",[a,seen,clearing]),/账目已变化/);
const refreshed=(await list()).map(r=>r.revision);
await db.query("select public.commit_ledger_scope($1,array['expense'],$2,'[]',true)",[a,refreshed]);
assert.equal((await list()).length,0);
const restoreRows=Array.from({length:10005},(_,i)=>({...row,id:"restore-"+i}));
await apply(restoreRows);
assert.equal((await page(0,3,"")).groups.expense.count,10005);
assert.equal((await page(0,3,"")).rows.length,3);
await apply([],await token());
assert.equal((await list()).length,0);
await login(b);await assert.rejects(mode("expense",false));await assert.rejects(apply([row]));
await db.exec("reset role;set role anon");
await assert.rejects(list());
await assert.rejects(save(a, [row]));
await db.close();
console.log("Ledger user isolation, stale edits and import rollback passed.");
