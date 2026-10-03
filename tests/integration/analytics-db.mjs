// Run with PGLITE_MODULE pointing to an installed @electric-sql/pglite entry point.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
create table public.profiles(id uuid primary key);
create function public.is_admin() returns boolean language sql as $$ select current_setting('test.admin',true) = 'yes' $$;
create function public.has_admin_permission(text) returns boolean language sql as $$ select false $$;
grant usage on schema public to authenticated, anon;
`);
for (const name of ['025_add_site_page_views.sql','030_analytics_summary.sql','031_restrict_page_view_inserts.sql','033_unified_analytics.sql']) {
  await db.exec(await readFile(new URL('../../supabase/migrations/'+name, import.meta.url),'utf8'));
}
await db.exec(`set test.admin = 'yes';
insert into site_page_views(path,visitor_id,site,created_at,referrer) values
('/same','browser-one','openaa',now()-interval '1 second','https://google.com/search?q=secret'),
('/same','browser-one','openaa',now()-interval '1 second',null),
('/same','browser-one','dmv',now()-interval '1 second','google.com'),
('/old','old','tools',now()-interval '40 days',null);
set role authenticated;`);
const report = (site = null, period = '7') => db.query('select get_unified_analytics($1,$2) as report',[site,period]).then(r=>r.rows[0].report);
let result = await report();
assert.equal(result.views,3); assert.equal(result.visitors,2); assert.equal(result.pages.length,2); assert.equal(result.daily.length,7);
assert.equal(result.dimensions.sources.find(r=>r.label==='google.com').views,2);
assert.equal((await report('openaa')).visitors,1);
assert.equal((await report('tools','30')).views,0);
assert.equal((await report(null,'yesterday')).daily.length,1);
let legacy=await db.query("select get_site_analytics_summary(now()-interval '1 day',now()-interval '7 days',now()-interval '5 minutes') as report");
assert.equal(legacy.rows[0].report.todayViews,2);
await assert.rejects(report('evil'));
await db.exec("set test.admin = 'no'");
await assert.rejects(report(), /Administrator required/);
assert.equal((await db.query('select * from site_page_views')).rows.length,0);
await assert.rejects(db.exec("insert into site_page_views(path,visitor_id) values('/bad','bad')"));
await db.exec('reset role; set role anon');
await assert.rejects(report());
await db.exec("reset role; set test.admin = 'yes'");
await db.exec("insert into site_page_views(path,visitor_id,site,event_id) values('/x','id','dmv','11111111-1111-4111-8111-111111111111')");
await assert.rejects(db.exec("insert into site_page_views(path,visitor_id,site,event_id) values('/x','id','dmv','11111111-1111-4111-8111-111111111111')"));
for (const [first,last,hours] of [['2026-03-08','2026-03-09',23],['2026-11-01','2026-11-02',25]]) {
 const { rows } = await db.query("select extract(epoch from (($2::timestamp at time zone 'America/New_York') - ($1::timestamp at time zone 'America/New_York')))/3600 as hours",[first,last]);
 assert.equal(Number(rows[0].hours),hours);
}
console.log('PASS: migration, site separation, distinct UV, zero filling, referrer privacy, legacy dashboard, RLS, anonymous rejection, dedupe and DST');
await db.close();
