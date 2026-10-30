// Isolated real PostgreSQL engine; no requests to production or mutations of real users.
// PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node tests/integration/account-post-permissions.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const read = name => readFile(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8');
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
let baseline = (await read('001_baseline_schema.sql')).replace('create extension if not exists pgcrypto;','');
const declarations = [...baseline.matchAll(/create table public\.(\w+) \([\s\S]*?\n\);/g)];
const pending = new Map(declarations.map(m=>[m[1],m[0]])), ordered=[];
for(const [,declaration] of pending) baseline=baseline.replace(declaration,'');
while(pending.size){
 const ready=[...pending].find(([,sql])=>[...sql.matchAll(/references public\.(\w+)/g)].every(m=>!pending.has(m[1])));
 assert.ok(ready,'No circular foreign-key dependencies in fixture bootstrap');
 ordered.push(ready[1]);pending.delete(ready[0]);
}
baseline=baseline.replace('create or replace function public.set_updated_at()',ordered.join('\n')+'\ncreate or replace function public.set_updated_at()');
await db.exec(baseline);
for(const name of ['002_baseline_rls.sql','004_harden_admin_rls.sql','008_add_posts_deletion_source_compat.sql','026_add_post_pinning.sql','032_anonymous_post_display.sql','20261030174640_protect_account_and_post_management.sql']) await db.exec(await read(name));
const user='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333',unverified='44444444-4444-4444-8444-444444444444';
for(const id of [user,other,admin,unverified]) await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,$3)',[id,id+'@example.test',id===unverified?null:new Date()]);
await db.query("insert into admin_roles(user_id,role) values($1,'super_admin')",[admin]);
async function as(id,role='authenticated'){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role '+role);}
let checks=0;
async function denied(sql,params=[]){await assert.rejects(db.query(sql,params),e=>e.code==='42501');checks++;}
async function ok(sql,params=[]){const r=await db.query(sql,params);checks++;return r;}
await as(user);await ok("update profiles set nickname='普通用户',bio='hello' where id=$1",[user]);
for(const assignment of ["trust_level=99","is_verified_user=true","account_type='business'","private_metadata='{\"admin\":true}'","created_at=now()-interval '1 year'","email='fake@example.test'","email_verified=false"])
 await denied('update profiles set '+assignment+' where id=$1',[user]);
await as(admin);await ok("update profiles set status='banned' where id=$1",[user]);
await as(user);await denied("update profiles set status='active' where id=$1",[user]);
await as(admin);await ok("update profiles set status='active',private_metadata='{\"note\":\"reviewed\"}' where id=$1",[user]);
await denied("update profiles set email='fake@example.test' where id=$1",[user]);
await as(user);await ok('update profiles set email=$2,email_verified=true,last_login_at=now() where id=$1',[user,user+'@example.test']);
const post=(await ok("insert into posts(author_id,post_type,title,status) values($1,'job','Test','published') returning id",[user])).rows[0].id;
await ok("insert into post_contacts(post_id,phone) values($1,'1234567890')",[post]);
await ok("insert into post_details_jobs(post_id,employment_type) values($1,'full_time')",[post]);
await ok("update posts set body='edited' where id=$1",[post]);
for(const assignment of ["author_id='"+other+"'","post_type='housing'","last_admin_action='approve_post'","created_at=now()-interval '1 year'","expires_at=now()+interval '1 year'","is_pinned=true"])
 await denied('update posts set '+assignment+' where id=$1',[post]);
// The explicit business requirement: admin hides -> author edits main/child rows -> republishes.
await as(admin);await ok("update posts set status='hidden',last_admin_action='hide_post',last_admin_action_by=$2,last_admin_action_at=now() where id=$1",[post,admin]);
await as(user);await ok("update posts set body='corrected after admin hide',status='hidden',published_at=null where id=$1",[post]);
await ok("update post_contacts set phone='0987654321' where post_id=$1",[post]);
await ok("update post_details_jobs set employment_type='part_time' where post_id=$1",[post]);
await ok("update posts set status='published',hidden_at=null where id=$1",[post]);
const history=(await db.query('select last_admin_action,last_admin_action_by from posts where id=$1',[post])).rows[0];assert.equal(history.last_admin_action,'hide_post');assert.equal(history.last_admin_action_by,admin);checks++;
await denied('update posts set last_admin_action=null,last_admin_action_by=null where id=$1',[post]);
await ok("update posts set status='hidden',hidden_at=now() where id=$1",[post]);await ok("update posts set status='published',hidden_at=null where id=$1",[post]);
await as(admin);await ok("update posts set status='pending_review' where id=$1",[post]);
await as(user);await denied("update posts set status='published' where id=$1",[post]);await denied("update posts set status='draft' where id=$1",[post]);
await ok("update posts set body='pending edit' where id=$1",[post]);
await as(admin);await ok("update posts set status='published' where id=$1",[post]);
for(const status of ['restricted','banned','pending']){
 await as(admin);await ok('update profiles set status=$2 where id=$1',[user,status]);await as(user);
 await denied("insert into posts(author_id,post_type,title,status) values($1,'job','blocked','published')",[user]);
 await denied("update posts set body='blocked' where id=$1",[post]);
 await denied("update post_contacts set phone='0000000000' where post_id=$1",[post]);
 await denied("update post_details_jobs set employment_type='other' where post_id=$1",[post]);
}
await as(unverified);await denied("insert into posts(author_id,post_type,title,status) values($1,'job','unverified','published')",[unverified]);
await denied("update profiles set email_verified=true where id=$1",[unverified]);
await as(admin);await ok("update profiles set status='active' where id=$1",[user]);
await as(user);await ok("update posts set status='deleted',deleted_at=now(),deleted_by=$2,deletion_source='user' where id=$1",[post,user]);
assert.equal((await db.query("update posts set status='published' where id=$1 returning id",[post])).rows.length,0);checks++;
// Cross-owner edits must not silently affect a public post.
await as(other);
assert.equal((await db.query("update posts set body='not mine' where id=$1 returning id",[post])).rows.length,0);checks++;
await denied("insert into posts(author_id,post_type,title,status,last_admin_action) values($1,'job','spoof','published','approve_post')",[other]);
await denied("insert into posts(author_id,post_type,title,status) values($1,'job','spoof','rejected')",[other]);
// Real Auth confirmation may be synchronized; it cannot be forged by the caller.
await db.exec('reset role');
await db.query('update auth.users set email_confirmed_at=now() where id=$1',[unverified]);
await as(unverified);
await ok('update profiles set email_verified=true where id=$1',[unverified]);
await ok("insert into posts(author_id,post_type,title,status) values($1,'job','now verified','published')",[unverified]);
await as('','anon');await denied("insert into posts(author_id,post_type,title) values($1,'job','anonymous')",[user]);await denied('select * from app_private.own_auth_identity()');
console.log(`PASS: ${checks} permission checks, including admin-hide -> author-edit -> republish with moderation history preserved`);
await db.close();
