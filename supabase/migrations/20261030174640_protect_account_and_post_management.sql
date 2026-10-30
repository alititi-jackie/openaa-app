-- Preserve automatic publication and author editing/republication of hidden posts.
-- Protect management-only fields even when callers bypass the application's forms.
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

-- Read only the caller's authoritative Auth identity. No caller-supplied user ID.
-- This private definer is needed because authenticated cannot read auth.users.
create or replace function app_private.own_auth_identity()
returns table(email text, email_verified boolean)
language sql stable security definer set search_path = '' as $$
 select u.email::text, u.email_confirmed_at is not null
 from auth.users u where u.id = (select auth.uid());
$$;
revoke all on function app_private.own_auth_identity() from public, anon;
grant execute on function app_private.own_auth_identity() to authenticated;

create or replace function app_private.guard_profile_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
 identity record;
 manager boolean;
 editable text[] := array['nickname','avatar_url','phone','wechat_id','whatsapp',
  'preferred_contact_method','default_publish_contact_name','publish_email_mode',
  'publish_email','bio','location_area','city_id','public_metadata','email','email_verified',
  'last_login_at','last_active_at','updated_at'];
begin
 -- Auth's profile trigger and trusted service-role maintenance are not end-user writes.
 if current_user not in ('anon','authenticated') then return new; end if;
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 manager := public.is_admin() and public.has_admin_permission('manage_user_status');
 if new.id is distinct from auth.uid() and not manager then
  raise exception 'Profile ownership required' using errcode='42501';
 end if;
 if tg_op='UPDATE' then
  if manager then editable := editable || array['status','private_metadata','trust_level','is_verified_user','account_type']; end if;
  if (to_jsonb(new)-editable) is distinct from (to_jsonb(old)-editable) then
   raise exception 'Account management fields are protected' using errcode='42501';
  end if;
 else
  if new.id is distinct from auth.uid() or new.status <> 'active' or new.account_type <> 'personal'
   or new.trust_level <> 0 or new.is_verified_user or new.private_metadata <> '{}'::jsonb then
   raise exception 'Invalid initial account fields' using errcode='42501';
  end if;
  new.created_at := now();
 end if;
 -- Preserve current login/profile synchronization, but verify it against Auth.
 if tg_op='INSERT' or new.email is distinct from old.email or new.email_verified is distinct from old.email_verified then
  select * into identity from app_private.own_auth_identity();
  if not found or new.id is distinct from auth.uid() or new.email is distinct from identity.email
   or new.email_verified is distinct from identity.email_verified then
   raise exception 'Email identity must match Auth' using errcode='42501';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function app_private.guard_profile_write() from public, anon, authenticated;
create trigger guard_profile_write before insert or update on public.profiles
for each row execute function app_private.guard_profile_write();

create or replace function app_private.guard_post_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
 actor_status public.profile_status;
 identity record;
 editable text[] := array['title','summary','body','category','subcategory','visibility','price_amount',
  'currency','is_anonymous','metadata','status','published_at','hidden_at','deleted_at','deleted_by',
  'deletion_source','deletion_error','deletion_error_at','updated_at'];
begin
 if current_user not in ('anon','authenticated') then return new; end if;
 if public.is_admin() and public.has_admin_permission('moderate_posts') then return new; end if;
 if auth.uid() is null or new.author_id is distinct from auth.uid() then
  raise exception 'Post ownership required' using errcode='42501';
 end if;
 select status into actor_status from public.profiles where id=auth.uid() for share;
 select * into identity from app_private.own_auth_identity();
 if actor_status is distinct from 'active'::public.profile_status or not coalesce(identity.email_verified,false) then
  -- Keep the existing restricted-account soft-delete option, without content edits.
  if tg_op <> 'UPDATE' or actor_status is distinct from 'restricted'::public.profile_status or new.status <> 'deleted' then
   raise exception 'Active verified account required' using errcode='42501';
  end if;
 end if;
 if tg_op='INSERT' then
  if new.status not in ('draft','pending_review','published')
   or new.last_admin_action is not null or new.last_admin_action_at is not null
   or new.last_admin_action_by is not null or new.last_admin_action_reason is not null
   or new.last_admin_action_template_key is not null or new.deleted_at is not null
   or new.deleted_by is not null or new.deletion_source is not null or new.deleted_source is not null
   or new.deletion_error is not null or new.deletion_error_at is not null
   or new.is_pinned or new.pinned_order <> 0 or new.pinned_until is not null or new.expires_at is not null then
   raise exception 'Invalid initial post management fields' using errcode='42501';
  end if;
  new.created_at := now(); new.hidden_at := null;
 else
  if (to_jsonb(new)-editable) is distinct from (to_jsonb(old)-editable) then
   raise exception 'Post identity and management history are protected' using errcode='42501';
  end if;
  if old.status='deleted' then raise exception 'Deleted posts require administrator recovery' using errcode='42501'; end if;
  if new.status='deleted' then
   if (to_jsonb(new)-array['status','deleted_at','deleted_by','deletion_source','deletion_error','deletion_error_at','updated_at'])
    is distinct from (to_jsonb(old)-array['status','deleted_at','deleted_by','deletion_source','deletion_error','deletion_error_at','updated_at']) then
    raise exception 'Deletion cannot change content' using errcode='42501';
   end if;
   new.deleted_at:=now(); new.deleted_by:=auth.uid(); new.deletion_source:='user';
   new.deletion_error:=null; new.deletion_error_at:=null;
   return new;
  end if;
  if old.status='rejected' then raise exception 'Rejected posts require moderator review' using errcode='42501'; end if;
  if old.status='pending_review' and new.status <> 'pending_review' then
   raise exception 'Only moderators can approve pending posts' using errcode='42501';
  end if;
  -- Hidden posts, including administrator-hidden ones, remain editable/re-publishable.
  if new.status <> old.status and not (
   (old.status='published' and new.status in ('hidden','draft'))
   or (old.status in ('draft','hidden','expired') and new.status in ('published','pending_review'))
  ) then raise exception 'Invalid author status transition' using errcode='42501'; end if;
  if new.deleted_at is distinct from old.deleted_at or new.deleted_by is distinct from old.deleted_by
   or new.deletion_source is distinct from old.deletion_source
   or new.deletion_error is distinct from old.deletion_error or new.deletion_error_at is distinct from old.deletion_error_at then
   raise exception 'Deletion metadata is protected' using errcode='42501';
  end if;
 end if;
 if new.status='published' then
  new.published_at:=case when tg_op='UPDATE' then coalesce(old.published_at,now()) else now() end;
 elsif new.status='hidden' and tg_op='UPDATE' then new.published_at:=old.published_at;
 else new.published_at:=null;
 end if;
 new.hidden_at:=case when new.status='hidden' then coalesce(new.hidden_at,now()) else null end;
 return new;
end;
$$;
revoke all on function app_private.guard_post_write() from public, anon, authenticated;
create trigger guard_post_write before insert or update on public.posts
for each row execute function app_private.guard_post_write();

-- Child writes cannot bypass a restriction by editing contacts, details or images directly.
create or replace function app_private.guard_post_child_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare parent public.posts; actor_status public.profile_status; identity record; target_id uuid;
begin
 if current_user not in ('anon','authenticated') or (public.is_admin() and public.has_admin_permission('moderate_posts')) then
  if tg_op='DELETE' then return old; else return new; end if;
 end if;
 if tg_op='UPDATE' and new.post_id is distinct from old.post_id then
  raise exception 'Post attachments cannot be reassigned' using errcode='42501';
 end if;
 target_id:=case when tg_op='DELETE' then old.post_id else new.post_id end;
 select status into actor_status from public.profiles where id=auth.uid() for share;
 select * into identity from app_private.own_auth_identity();
 if actor_status is distinct from 'active'::public.profile_status or not coalesce(identity.email_verified,false) then
  raise exception 'Active verified account required' using errcode='42501';
 end if;
 select * into parent from public.posts where id=target_id for share;
 if not found or parent.author_id is distinct from auth.uid() or parent.status in ('deleted','rejected') then
  raise exception 'Post is not editable by this author' using errcode='42501';
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function app_private.guard_post_child_write() from public, anon, authenticated;
do $$ declare t text; begin
 foreach t in array array['post_details_jobs','post_details_housing','post_details_marketplace',
  'post_details_services','post_contacts','post_images'] loop
  execute format('create trigger guard_post_child_write before insert or update or delete on public.%I for each row execute function app_private.guard_post_child_write()',t);
 end loop;
end $$;
