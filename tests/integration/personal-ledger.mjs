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
await db.exec("reset role;set role anon");
await assert.rejects(list());
await assert.rejects(save(a, [row]));
await db.close();
console.log("Ledger user isolation, stale edits and import rollback passed.");
