// Isolated real PostgreSQL engine; no requests to production or mutations of real users.
// PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node tests/integration/account-post-permissions.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { PGlite } = await import(
  process.env.PGLITE_MODULE || "@electric-sql/pglite"
);
const db = new PGlite();
const read = (name) =>
  readFile(
    new URL("../../supabase/migrations/" + name, import.meta.url),
    "utf8",
  );
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema storage;
create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}',last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_user::text $$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key,bucket_id text,name text);
create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
grant usage on schema auth,public to anon,authenticated;
`);
// Historical baseline has forward foreign-key references. Topologically order its
// unchanged table declarations for the isolated bootstrap (production already exists).
let baseline = (await read("001_baseline_schema.sql")).replace(
  "create extension if not exists pgcrypto;",
  "",
);
const declarations = [
  ...baseline.matchAll(/create table public\.(\w+) \([\s\S]*?\n\);/g),
];
const pending = new Map(declarations.map((m) => [m[1], m[0]])),
  ordered = [];
for (const [, declaration] of pending)
  baseline = baseline.replace(declaration, "");
while (pending.size) {
  const ready = [...pending].find(([, sql]) =>
    [...sql.matchAll(/references public\.(\w+)/g)].every(
      (m) => !pending.has(m[1]),
    ),
  );
  assert.ok(ready, "No circular foreign-key dependencies in fixture bootstrap");
  ordered.push(ready[1]);
  pending.delete(ready[0]);
}
baseline = baseline.replace(
  "create or replace function public.set_updated_at()",
  ordered.join("\n") + "\ncreate or replace function public.set_updated_at()",
);
await db.exec(baseline);
for (const name of [
  "002_baseline_rls.sql",
  "004_harden_admin_rls.sql",
  "008_add_posts_deletion_source_compat.sql",
  "026_add_post_pinning.sql",
  "032_anonymous_post_display.sql",
  "20261030174640_protect_account_and_post_management.sql",
])
  await db.exec(await read(name));

for (const name of [
  "003_seed_required_settings.sql",
  "009_add_post_views_user_agent.sql",
  "010_harden_post_stats_refresh_deleted_posts.sql",
  "025_add_site_page_views.sql",
  "030_analytics_summary.sql",
  "031_restrict_page_view_inserts.sql",
  "033_unified_analytics.sql",
])
  await db.exec(await read(name));
const owner = "11111111-1111-4111-8111-111111111111";
const publisher = "22222222-2222-4222-8222-222222222222";
for (const id of [owner, publisher])
  await db.query(
    "insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())",
    [id, id + "@example.test"],
  );
await db.query(
  "insert into admin_roles(user_id,role) values($1,'editor')",
  [publisher],
);
await db.query("insert into admin_user_modules(user_id,module_key) values($1,'news')", [publisher]);
const city = (await db.query("select id from cities where slug='ny'")).rows[0]
  .id;
const posts = {};
for (const [type, path] of [
  ["job", "jobs"],
  ["housing", "housing"],
  ["marketplace", "marketplace"],
  ["service", "services"],
]) {
  posts[path] = (
    await db.query(
      "insert into posts(author_id,city_id,post_type,title,status) values($1,$2,$3,'Test','published') returning id",
      [owner, city, type],
    )
  ).rows[0].id;
}
const news = (
  await db.query(
    "insert into news_posts(title,slug,body,status,created_at,published_at) values('Test News','test-news','Body','published',now()-interval '1 day',now()-interval '1 day') returning id,updated_at",
  )
).rows[0];
await db.query("insert into post_views(post_id,visitor_id) values($1,'old')", [
  posts.jobs,
]);
await db.query(
  "insert into site_page_views(site,path,title,visitor_id,user_agent) values('openaa','/news/test-news','Test News | OpenAA','old','Mozilla')",
);
await db.query(
  "insert into site_page_views(site,path,title,visitor_id,user_agent) values('openaa','/news/test-news','Different article','old','Mozilla')",
);
await db.exec(await read("20261102030639_unified_content_views.sql"));
const value = async (sql, args = []) =>
  Object.values((await db.query(sql, args)).rows[0])[0];
const postCount = (id) =>
  value(
    "select coalesce((select view_count from post_stats where post_id=$1),0)",
    [id],
  );
const newsCount = () =>
  value("select view_count::int from news_stats where news_id=$1", [news.id]);
assert.equal(await postCount(posts.jobs), 1);
assert.equal(
  await newsCount(),
  1,
  "only reliably matched historical news backfilled",
);
await db.exec(
  "grant usage on schema public,auth to service_role; grant all on all tables in schema public to service_role;",
);
const event = async (path, eventId = crypto.randomUUID(), site = "openaa") => {
  await db.exec("set role service_role");
  try {
    await db.query(
      "insert into site_page_views(path,visitor_id,event_id,site,user_agent) values($1,'same-browser',$2,$3,'Mozilla') on conflict do nothing",
      [path, eventId, site],
    );
  } finally {
    await db.exec("reset role");
  }
  return eventId;
};
for (const [path, id] of Object.entries(posts)) {
  const before = await postCount(id);
  const ev = await event("/" + path + "/" + id);
  await event("/" + path + "/" + id, ev);
  assert.equal(
    await postCount(id),
    before + 1,
    "duplicate event does not increment",
  );
  await event("/" + path + "/" + id);
  assert.equal(
    await postCount(id),
    before + 2,
    "refresh within 30 minutes counts",
  );
  await db.query("select refresh_post_stats($1)", [id]);
  assert.equal(
    await postCount(id),
    before + 2,
    "old refresh retains new totals",
  );
}
const ev = await event("/news/test-news");
await event("/news/test-news", ev);
await event("/news/test-news");
assert.equal(await newsCount(), 3);
await event("/news");
await event("/news/missing");
await event("/news/test-news", crypto.randomUUID(), "dmv");
assert.equal(await newsCount(), 3);
assert.deepEqual(
  await value("select updated_at from news_posts where id=$1", [news.id]),
  news.updated_at,
  "views never update article timestamp",
);
await db.query(
  "update news_posts set slug='renamed',status='hidden' where id=$1",
  [news.id],
);
await event("/news/renamed");
assert.equal(await newsCount(), 3);
await db.query("update news_posts set status='published' where id=$1", [
  news.id,
]);
await event("/news/renamed");
assert.equal(await newsCount(), 4, "rename and republish retain counts");
await db.query(
  "update news_posts set published_at=now()+interval '1 day' where id=$1",
  [news.id],
);
await event("/news/renamed");
assert.equal(await newsCount(), 4);
await db.query(
  "update news_posts set published_at=now()-interval '1 day' where id=$1",
  [news.id],
);
await db.query("update posts set status='hidden' where id=$1", [posts.jobs]);
const old = await postCount(posts.jobs);
await event("/jobs/" + posts.jobs);
assert.equal(await postCount(posts.jobs), old);
await db.query("update posts set status='published' where id=$1", [posts.jobs]);
await event("/housing/" + posts.jobs);
assert.equal(
  await postCount(posts.jobs),
  old,
  "wrong route type is not counted",
);
await db.exec("set role anon");
assert.equal(
  (await db.query("select * from news_stats")).rows.length,
  0,
  "disabled counts are private",
);
await assert.rejects(
  db.query("insert into post_views(post_id,visitor_id) values($1,'spoof')", [
    posts.jobs,
  ]),
);
await assert.rejects(
  db.query(
    "insert into site_page_views(path,visitor_id) values('/news/renamed','spoof')",
  ),
);
const compat = await value("select record_post_view($1,null,null)", [
  posts.jobs,
]);
assert.equal(compat, old);
await db.exec("reset role");
assert.equal(
  await postCount(posts.jobs),
  old,
  "old RPC cannot add another view",
);
async function as(id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
await as(owner);
assert.equal(
  (
    await db.query(
      "update site_settings set value='{\"detail\":true,\"list\":true}' where key='news_view_display' returning key",
    )
  ).rows.length,
  0,
);
await as(publisher);
assert.equal(
  (await db.query("select * from news_stats")).rows.length,
  1,
  "admin sees counts even when disabled",
);
for (const [detail, list] of [
  [false, false],
  [true, false],
  [false, true],
  [true, true],
]) {
  await db.query(
    "update site_settings set value=$1 where key='news_view_display'",
    [JSON.stringify({ detail, list })],
  );
  await db.exec("set role anon");
  assert.equal(
    (await db.query("select * from news_stats")).rows.length,
    detail || list ? 1 : 0,
  );
  await as(publisher);
}
await db.exec("reset role");
await db.query("delete from posts where id=$1", [posts.jobs]);
assert.equal(
  await value("select count(*)::int from post_stats where post_id=$1", [
    posts.jobs,
  ]),
  0,
  "deletion cascade remains safe",
);
console.log(
  "PASS: preserved historical counts, four channels, PV increments, duplicate event protection, news backfill, hidden/future/wrong routes, rename, timestamps, old refresh/RPC, RLS, four switch states and deletion",
);
await db.close();
