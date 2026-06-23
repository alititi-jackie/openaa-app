-- OpenAA production baseline RLS.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    join public.profiles p on p.id = ar.user_id
    where ar.user_id = auth.uid()
      and ar.is_active = true
      and p.status = 'active'
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    join public.profiles p on p.id = ar.user_id
    where ar.user_id = auth.uid()
      and ar.role = 'super_admin'
      and ar.is_active = true
      and p.status = 'active'
  );
$$;

create or replace function public.is_owner_super_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and lower(p.email) = 'fengjiancheng8@gmail.com'
  );
$$;

create or replace function public.protect_owner_super_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' and public.is_owner_super_admin_user(old.user_id) then
    raise exception 'Owner super admin cannot be deleted from admin_roles';
  end if;

  if tg_op in ('INSERT', 'UPDATE') and public.is_owner_super_admin_user(new.user_id) then
    if new.role <> 'super_admin' or new.is_active is not true then
      raise exception 'Owner super admin must remain an active super_admin';
    end if;
  end if;

  if tg_op = 'UPDATE' and public.is_owner_super_admin_user(old.user_id) and old.user_id <> new.user_id then
    raise exception 'Owner super admin user_id cannot be changed';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists protect_owner_super_admin_role on public.admin_roles;
create trigger protect_owner_super_admin_role
before insert or update or delete on public.admin_roles
for each row execute function public.protect_owner_super_admin_role();

create or replace function public.has_admin_module(p_module_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.admin_user_modules aum
      join public.admin_roles ar on ar.user_id = aum.user_id and ar.is_active = true
      join public.profiles p on p.id = aum.user_id and p.status = 'active'
      where aum.user_id = auth.uid()
        and aum.module_key = p_module_key
        and aum.is_allowed = true
    );
$$;

create or replace function public.has_admin_exemption(p_exemption_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.is_super_admin() then true
    when p_exemption_key not in ('daily_post_limit', 'rename_limit') then false
    when exists (
      select 1
      from public.admin_roles ar
      join public.admin_user_exemptions aue on aue.user_id = ar.user_id
      join public.profiles p on p.id = ar.user_id and p.status = 'active'
      where ar.user_id = auth.uid()
        and ar.is_active = true
        and aue.exemption_key = p_exemption_key
        and aue.is_enabled = true
    ) then true
    else false
  end;
$$;

create or replace function public.has_admin_permission(p_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with active_role as (
    select ar.role
    from public.admin_roles ar
    join public.profiles p on p.id = ar.user_id
    where ar.user_id = auth.uid()
      and ar.is_active = true
      and p.status = 'active'
  )
  select case
    when public.is_super_admin() then true
    when exists (
      select 1
      from public.admin_user_permissions aup
      where aup.user_id = auth.uid()
        and aup.permission_key = p_permission_key
        and aup.effect = 'deny'
    ) then false
    when exists (
      select 1
      from public.admin_user_permissions aup
      where aup.user_id = auth.uid()
        and aup.permission_key = p_permission_key
        and aup.effect = 'allow'
    ) then true
    when exists (
      select 1
      from public.admin_role_permissions arp
      join active_role ar on ar.role = arp.role
      where arp.permission_key = p_permission_key
        and arp.allowed = true
    ) then true
    else false
  end;
$$;

create or replace function public.is_public_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and p.status = 'published'
      and p.visibility = 'public'
      and (p.expires_at is null or p.expires_at > now())
  );
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'cities','site_settings','rate_limits','search_logs','profiles','business_profiles','user_auth_identities',
    'user_settings','user_blocks','user_security_logs','admin_roles','admin_permissions','admin_role_permissions',
    'admin_user_permissions','admin_user_modules','admin_user_exemptions','admin_module_permissions','admin_audit_logs',
    'feature_flags','image_assets','posts','post_details_jobs','post_details_housing','post_details_marketplace',
    'post_details_services','post_contacts','post_stats','post_views','post_reports','post_admin_events','post_images',
    'user_favorites','news_categories','news_posts','navigation_categories','navigation_links','user_navigation_links',
    'user_navigation_settings','home_sections','home_banners','top_quick_links','latest_ticker',
    'latest_ticker_global_settings','latest_ticker_sections','ads','dmv_questions','dmv_user_progress',
    'dmv_wrong_questions','dmv_exam_results','dmv_question_imports','notifications','notification_templates',
    'support_tickets','support_ticket_settings','support_ticket_events','user_consents','account_deletion_requests'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy "Public can read active cities" on public.cities for select using (is_active = true);
create policy "Admins can manage cities" on public.cities for all using (public.has_admin_permission('manage_settings')) with check (public.has_admin_permission('manage_settings'));

create policy "Public can read public site settings" on public.site_settings for select using (is_public = true);
create policy "Admins can manage site settings" on public.site_settings for all using (public.has_admin_permission('manage_settings')) with check (public.has_admin_permission('manage_settings'));

create policy "Admins can manage rate limits" on public.rate_limits for all using (public.has_admin_permission('manage_rate_limits') or public.is_admin()) with check (public.has_admin_permission('manage_rate_limits') or public.is_admin());
create policy "Users can insert own search logs" on public.search_logs for insert with check (auth.uid() = user_id);
create policy "Users can read own search logs" on public.search_logs for select using (auth.uid() = user_id);
create policy "Admins can read search logs" on public.search_logs for select using (public.has_admin_permission('view_search_logs'));

create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins can read profiles" on public.profiles for select using (public.has_admin_permission('view_users'));
create policy "Admins can update profiles" on public.profiles for update using (public.has_admin_permission('manage_user_status')) with check (public.has_admin_permission('manage_user_status'));

create policy "Public can read active public business profiles" on public.business_profiles for select using (is_public = true and is_active = true);
create policy "Users can manage own business profile" on public.business_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins can manage business profiles" on public.business_profiles for all using (public.has_admin_permission('manage_user_status')) with check (public.has_admin_permission('manage_user_status'));

create policy "Users can read own auth identities" on public.user_auth_identities for select using (auth.uid() = user_id);
create policy "Users can manage own settings" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own blocks" on public.user_blocks for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);
create policy "Users can read own security logs" on public.user_security_logs for select using (auth.uid() = user_id);

create policy "Admins can read admin roles" on public.admin_roles for select using (auth.uid() = user_id or public.has_admin_permission('view_admins') or public.has_admin_permission('manage_admins'));
create policy "Authorized admins can manage admin roles" on public.admin_roles for all using (public.is_super_admin() or public.has_admin_permission('manage_admins')) with check (public.is_super_admin() or public.has_admin_permission('manage_admins'));
create policy "Admins can read permission definitions" on public.admin_permissions for select using (public.has_admin_permission('view_admins') or public.has_admin_permission('manage_admins'));
create policy "Super admins can manage permission definitions" on public.admin_permissions for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Admins can read role permission mappings" on public.admin_role_permissions for select using (public.has_admin_permission('view_admins') or public.has_admin_permission('manage_admins'));
create policy "Super admins can manage role permission mappings" on public.admin_role_permissions for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Admins can read user permission overrides" on public.admin_user_permissions for select using (public.has_admin_permission('view_admins') or public.has_admin_permission('manage_admins'));
create policy "Super admins can manage user permission overrides" on public.admin_user_permissions for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Admins can read module grants" on public.admin_user_modules for select using (public.has_admin_permission('view_admins') or public.has_admin_permission('manage_admins') or auth.uid() = user_id);
create policy "Super admins can manage module grants" on public.admin_user_modules for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Admins can read exemptions" on public.admin_user_exemptions for select using (public.has_admin_permission('view_admins') or public.has_admin_permission('manage_admins'));
create policy "Super admins can manage exemptions" on public.admin_user_exemptions for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Super admins can read module permissions" on public.admin_module_permissions for select using (public.is_super_admin());
create policy "Super admins can manage module permissions" on public.admin_module_permissions for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Admins can read audit logs" on public.admin_audit_logs for select using (public.has_admin_permission('view_admin_audit_logs') or public.has_admin_permission('view_audit_logs'));

create policy "Public can read enabled public feature flags" on public.feature_flags for select using (is_enabled = true and visibility = 'public');
create policy "Admins can manage feature flags" on public.feature_flags for all using (public.has_admin_permission('manage_settings')) with check (public.has_admin_permission('manage_settings'));

create policy "Public can read image assets" on public.image_assets for select using (is_deleted = false);
create policy "Users can upload own image assets" on public.image_assets for insert with check (auth.uid() = owner_id);
create policy "Users can update own image assets" on public.image_assets for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Admins can manage image assets" on public.image_assets for all using (public.has_admin_permission('manage_image_assets')) with check (public.has_admin_permission('manage_image_assets'));

create policy "Public can read published posts" on public.posts for select using (status = 'published' and visibility = 'public' and (expires_at is null or expires_at > now()));
create policy "Authors can read own posts" on public.posts for select using (auth.uid() = author_id);
create policy "Authors can create own posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "Authors can update active own posts" on public.posts for update using (auth.uid() = author_id and status <> 'deleted') with check (auth.uid() = author_id);
create policy "Admins can manage posts" on public.posts for all using (public.has_admin_permission('moderate_posts') or public.has_admin_permission('view_posts')) with check (public.has_admin_permission('moderate_posts'));

create policy "Public can read public post details" on public.post_details_jobs for select using (public.is_public_post(post_id));
create policy "Public can read public housing details" on public.post_details_housing for select using (public.is_public_post(post_id));
create policy "Public can read public marketplace details" on public.post_details_marketplace for select using (public.is_public_post(post_id));
create policy "Public can read public service details" on public.post_details_services for select using (public.is_public_post(post_id));
create policy "Authors can manage own job details" on public.post_details_jobs for all using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())) with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "Authors can manage own housing details" on public.post_details_housing for all using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())) with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "Authors can manage own marketplace details" on public.post_details_marketplace for all using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())) with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "Authors can manage own service details" on public.post_details_services for all using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())) with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "Public can read contacts for public posts" on public.post_contacts for select using (public.is_public_post(post_id));
create policy "Authors can manage own contacts" on public.post_contacts for all using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())) with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy "Public can read post stats" on public.post_stats for select using (public.is_public_post(post_id));
create policy "Users and anonymous visitors can insert post views" on public.post_views for insert with check (
  public.is_public_post(post_id)
  and (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null and visitor_id is not null and length(btrim(visitor_id)) > 0)
  )
);
create policy "Users and visitors can submit post reports" on public.post_reports for insert with check (
  public.is_public_post(post_id)
  and length(btrim(detail)) between 10 and 1000
  and (
    (auth.uid() is not null and reporter_id = auth.uid() and visitor_id is null)
    or (auth.uid() is null and reporter_id is null and visitor_id is not null and length(btrim(visitor_id)) > 0)
  )
);
create policy "Messages admins can read post reports" on public.post_reports for select using (public.has_admin_module('messages') or (deleted_at is not null and public.has_admin_module('recycle-bin')));
create policy "Messages admins can manage post reports" on public.post_reports for update using (public.has_admin_module('messages') or (deleted_at is not null and public.has_admin_module('recycle-bin'))) with check (public.has_admin_module('messages') or public.has_admin_module('recycle-bin'));
create policy "Admins can read post admin events" on public.post_admin_events for select using (public.has_admin_permission('view_posts') or public.has_admin_permission('moderate_posts'));
create policy "Admins can create post admin events" on public.post_admin_events for insert with check (public.has_admin_permission('moderate_posts'));
create policy "Public can read public post images" on public.post_images for select using (public.is_public_post(post_id));
create policy "Authors can manage own post images" on public.post_images for all using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())) with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "Users can manage own user favorites" on public.user_favorites for all using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and (
    (
      target_type in ('job', 'housing', 'marketplace', 'service', 'post')
      and target_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and public.is_public_post(target_id::uuid)
    )
    or (
      target_type = 'news'
      and exists (
        select 1
        from public.news_posts np
        where np.id::text = target_id
          and np.status = 'published'
          and (np.published_at is null or np.published_at <= now())
      )
    )
  )
);

create policy "Public can read active news categories" on public.news_categories for select using (is_active = true);
create policy "News editors can manage categories" on public.news_categories for all using (public.has_admin_permission('manage_news_categories')) with check (public.has_admin_permission('manage_news_categories'));
create policy "Public can read published news" on public.news_posts for select using (status = 'published' and (published_at is null or published_at <= now()));
create policy "News editors can manage news" on public.news_posts for all using (public.has_admin_permission('view_news') or public.has_admin_permission('edit_news') or public.has_admin_permission('publish_news') or public.has_admin_permission('delete_news')) with check (public.has_admin_permission('edit_news') or public.has_admin_permission('publish_news') or public.has_admin_permission('delete_news'));

create policy "Public can read active navigation categories" on public.navigation_categories for select using (is_active = true);
create policy "Public can read active navigation links" on public.navigation_links for select using (is_active = true and deleted_at is null);
create policy "Admins can manage navigation" on public.navigation_categories for all using (public.has_admin_permission('manage_navigation')) with check (public.has_admin_permission('manage_navigation'));
create policy "Admins can manage navigation links" on public.navigation_links for all using (public.has_admin_permission('manage_navigation') or public.has_admin_module('recycle-bin')) with check (public.has_admin_permission('manage_navigation') or public.has_admin_module('recycle-bin'));
create policy "Users can manage own navigation links" on public.user_navigation_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own navigation settings" on public.user_navigation_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Public can read visible home sections" on public.home_sections for select using (is_visible = true);
create policy "Public can read active home banners" on public.home_banners for select using (is_active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "Public can read active quick links" on public.top_quick_links for select using (is_active = true);
create policy "Public can read active latest ticker" on public.latest_ticker for select using (is_enabled = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "Public can read ticker settings" on public.latest_ticker_global_settings for select using (true);
create policy "Public can read ticker sections" on public.latest_ticker_sections for select using (true);
create policy "Home admins can manage home sections" on public.home_sections for all using (public.has_admin_permission('manage_home_sections')) with check (public.has_admin_permission('manage_home_sections'));
create policy "Home admins can manage home banners" on public.home_banners for all using (public.has_admin_permission('manage_home_sections')) with check (public.has_admin_permission('manage_home_sections'));
create policy "Home admins can manage top quick links" on public.top_quick_links for all using (public.has_admin_permission('manage_top_links') or public.has_admin_permission('manage_home_sections')) with check (public.has_admin_permission('manage_top_links') or public.has_admin_permission('manage_home_sections'));
create policy "Home admins can manage latest ticker" on public.latest_ticker for all using (public.has_admin_permission('manage_latest_ticker')) with check (public.has_admin_permission('manage_latest_ticker'));
create policy "Home admins can manage ticker global settings" on public.latest_ticker_global_settings for all using (public.has_admin_permission('manage_latest_ticker')) with check (public.has_admin_permission('manage_latest_ticker'));
create policy "Home admins can manage ticker sections" on public.latest_ticker_sections for all using (public.has_admin_permission('manage_latest_ticker')) with check (public.has_admin_permission('manage_latest_ticker'));

create policy "Public can read active ads" on public.ads for select using (deleted_at is null and is_active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "Admins can manage ads" on public.ads for all using (public.has_admin_permission('manage_ads')) with check (public.has_admin_permission('manage_ads'));

create policy "Public can read dmv questions" on public.dmv_questions for select using (is_active = true);
create policy "Users can manage own dmv progress" on public.dmv_user_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own wrong dmv questions" on public.dmv_wrong_questions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own dmv exam results" on public.dmv_exam_results for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins can manage dmv questions" on public.dmv_questions for all using (public.has_admin_permission('manage_settings')) with check (public.has_admin_permission('manage_settings'));
create policy "Admins can read dmv imports" on public.dmv_question_imports for select using (public.has_admin_permission('manage_settings'));

create policy "Users can read own notifications" on public.notifications for select using (auth.uid() = user_id and deleted_at is null);
create policy "Users can mark own notifications" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins can manage notification templates" on public.notification_templates for all using (public.has_admin_module('messages')) with check (public.has_admin_module('messages'));

create policy "Users and visitors can submit support tickets" on public.support_tickets for insert with check (
  length(btrim(content)) > 0
  and status = 'new'
  and priority = 'normal'
  and handled_by is null
  and handled_at is null
  and closed_at is null
  and deleted_at is null
  and deleted_by is null
  and admin_reply is null
  and admin_note is null
  and (
    (auth.uid() is not null and user_id = auth.uid() and visitor_id is null)
    or (auth.uid() is null and user_id is null and visitor_id is not null and length(btrim(visitor_id)) > 0)
  )
);
create policy "Users can read own support tickets" on public.support_tickets for select using (auth.uid() = user_id);
create policy "Messages admins can read support tickets" on public.support_tickets for select using (public.has_admin_module('messages') or (deleted_at is not null and public.has_admin_module('recycle-bin')));
create policy "Messages admins can handle support tickets" on public.support_tickets for update using (public.has_admin_module('messages') or (deleted_at is not null and public.has_admin_module('recycle-bin'))) with check (public.has_admin_module('messages') or public.has_admin_module('recycle-bin'));
create policy "Messages admins can read support ticket settings" on public.support_ticket_settings for select using (public.has_admin_module('messages'));
create policy "Messages admins can manage support ticket settings" on public.support_ticket_settings for all using (public.has_admin_module('messages')) with check (public.has_admin_module('messages'));
create policy "Messages admins can read support ticket events" on public.support_ticket_events for select using (public.has_admin_module('messages'));
create policy "Messages admins can create support ticket events" on public.support_ticket_events for insert with check (public.has_admin_module('messages') or actor_id = auth.uid() or actor_id is null);

create policy "Users can read own consents" on public.user_consents for select using (auth.uid() = user_id);
create policy "Users can insert own consents" on public.user_consents for insert with check (auth.uid() = user_id);
create policy "Users can create own deletion requests" on public.account_deletion_requests for insert with check (auth.uid() = user_id);
create policy "Users can read own deletion requests" on public.account_deletion_requests for select using (auth.uid() = user_id);
create policy "Admins can manage deletion requests" on public.account_deletion_requests for all using (public.has_admin_permission('manage_user_status')) with check (public.has_admin_permission('manage_user_status'));

revoke all on schema public from anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.cities, public.site_settings, public.feature_flags, public.image_assets, public.posts, public.post_details_jobs, public.post_details_housing, public.post_details_marketplace, public.post_details_services, public.post_contacts, public.post_stats, public.post_images, public.business_profiles, public.news_categories, public.news_posts, public.navigation_categories, public.navigation_links, public.home_sections, public.home_banners, public.top_quick_links, public.latest_ticker, public.latest_ticker_global_settings, public.latest_ticker_sections, public.ads, public.dmv_questions to anon, authenticated;
grant insert on public.post_views, public.post_reports, public.support_tickets to anon, authenticated;

grant select on public.rate_limits, public.search_logs, public.profiles, public.user_auth_identities, public.user_settings, public.user_blocks, public.user_security_logs, public.admin_roles, public.admin_permissions, public.admin_role_permissions, public.admin_user_permissions, public.admin_user_modules, public.admin_user_exemptions, public.admin_module_permissions, public.admin_audit_logs, public.post_views, public.post_reports, public.post_admin_events, public.user_favorites, public.user_navigation_links, public.user_navigation_settings, public.dmv_user_progress, public.dmv_wrong_questions, public.dmv_exam_results, public.dmv_question_imports, public.notifications, public.notification_templates, public.support_tickets, public.support_ticket_settings, public.support_ticket_events, public.user_consents, public.account_deletion_requests to authenticated;
grant insert on public.cities, public.site_settings, public.rate_limits, public.search_logs, public.profiles, public.business_profiles, public.user_settings, public.user_blocks, public.admin_roles, public.admin_permissions, public.admin_role_permissions, public.admin_user_permissions, public.admin_user_modules, public.admin_user_exemptions, public.admin_module_permissions, public.feature_flags, public.image_assets, public.posts, public.post_details_jobs, public.post_details_housing, public.post_details_marketplace, public.post_details_services, public.post_contacts, public.post_admin_events, public.post_images, public.user_favorites, public.news_categories, public.news_posts, public.navigation_categories, public.navigation_links, public.user_navigation_links, public.user_navigation_settings, public.home_sections, public.home_banners, public.top_quick_links, public.latest_ticker, public.latest_ticker_global_settings, public.latest_ticker_sections, public.ads, public.dmv_questions, public.dmv_user_progress, public.dmv_wrong_questions, public.dmv_exam_results, public.notification_templates, public.support_ticket_settings, public.support_ticket_events, public.user_consents, public.account_deletion_requests to authenticated;
grant update on public.cities, public.site_settings, public.rate_limits, public.profiles, public.business_profiles, public.user_settings, public.user_blocks, public.admin_roles, public.admin_permissions, public.admin_role_permissions, public.admin_user_permissions, public.admin_user_modules, public.admin_user_exemptions, public.admin_module_permissions, public.feature_flags, public.image_assets, public.posts, public.post_details_jobs, public.post_details_housing, public.post_details_marketplace, public.post_details_services, public.post_contacts, public.post_reports, public.post_images, public.user_favorites, public.news_categories, public.news_posts, public.navigation_categories, public.navigation_links, public.user_navigation_links, public.user_navigation_settings, public.home_sections, public.home_banners, public.top_quick_links, public.latest_ticker, public.latest_ticker_global_settings, public.latest_ticker_sections, public.ads, public.dmv_questions, public.dmv_user_progress, public.dmv_wrong_questions, public.dmv_exam_results, public.notifications, public.notification_templates, public.support_tickets, public.support_ticket_settings, public.account_deletion_requests to authenticated;
grant delete on public.cities, public.site_settings, public.rate_limits, public.business_profiles, public.user_blocks, public.admin_permissions, public.admin_role_permissions, public.admin_user_permissions, public.admin_user_modules, public.admin_user_exemptions, public.admin_module_permissions, public.feature_flags, public.image_assets, public.posts, public.post_details_jobs, public.post_details_housing, public.post_details_marketplace, public.post_details_services, public.post_contacts, public.post_views, public.post_reports, public.post_images, public.user_favorites, public.news_categories, public.news_posts, public.navigation_categories, public.navigation_links, public.user_navigation_links, public.home_banners, public.top_quick_links, public.latest_ticker, public.ads, public.dmv_user_progress, public.dmv_wrong_questions, public.dmv_exam_results, public.notification_templates, public.support_tickets, public.support_ticket_settings, public.support_ticket_events to authenticated;

grant execute on function public.record_post_view(uuid, text, text) to anon, authenticated;
grant execute on function public.refresh_post_stats(uuid) to authenticated;
grant execute on function public.has_admin_permission(text) to authenticated;
grant execute on function public.has_admin_module(text) to authenticated;
grant execute on function public.has_admin_exemption(text) to authenticated;
grant execute on function public.is_super_admin() to authenticated;

create policy "Public can read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload own avatar" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update own avatar" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete own avatar" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public can read post images" on storage.objects for select using (bucket_id = 'post-images');
create policy "Users can upload own post images" on storage.objects for insert to authenticated with check (bucket_id = 'post-images' and (storage.foldername(name))[1] in ('job', 'housing', 'marketplace', 'service') and (storage.foldername(name))[2] = auth.uid()::text);
create policy "Users can update own post images" on storage.objects for update to authenticated using (bucket_id = 'post-images' and (storage.foldername(name))[1] in ('job', 'housing', 'marketplace', 'service') and (storage.foldername(name))[2] = auth.uid()::text) with check (bucket_id = 'post-images' and (storage.foldername(name))[1] in ('job', 'housing', 'marketplace', 'service') and (storage.foldername(name))[2] = auth.uid()::text);
create policy "Users can delete own post images" on storage.objects for delete to authenticated using (bucket_id = 'post-images' and (storage.foldername(name))[1] in ('job', 'housing', 'marketplace', 'service') and (storage.foldername(name))[2] = auth.uid()::text);

create policy "Public can read news cover images" on storage.objects for select using (bucket_id = 'news-cover-images');
create policy "News admins can upload news cover images" on storage.objects for insert to authenticated with check (bucket_id = 'news-cover-images' and public.has_admin_permission('edit_news'));
create policy "News admins can update news cover images" on storage.objects for update to authenticated using (bucket_id = 'news-cover-images' and public.has_admin_permission('edit_news')) with check (bucket_id = 'news-cover-images' and public.has_admin_permission('edit_news'));
create policy "News admins can delete news cover images" on storage.objects for delete to authenticated using (bucket_id = 'news-cover-images' and public.has_admin_permission('delete_news'));

create policy "Public can read home banner images" on storage.objects for select using (bucket_id = 'home-banner-images');
create policy "Home admins can upload home banner images" on storage.objects for insert to authenticated with check (bucket_id = 'home-banner-images' and public.has_admin_permission('manage_home_sections'));
create policy "Home admins can update home banner images" on storage.objects for update to authenticated using (bucket_id = 'home-banner-images' and public.has_admin_permission('manage_home_sections')) with check (bucket_id = 'home-banner-images' and public.has_admin_permission('manage_home_sections'));
create policy "Home admins can delete home banner images" on storage.objects for delete to authenticated using (bucket_id = 'home-banner-images' and public.has_admin_permission('manage_home_sections'));

create policy "Public can read ad images" on storage.objects for select using (bucket_id = 'ad-images');
create policy "Ad admins can upload ad images" on storage.objects for insert to authenticated with check (bucket_id = 'ad-images' and public.has_admin_permission('manage_ads'));
create policy "Ad admins can update ad images" on storage.objects for update to authenticated using (bucket_id = 'ad-images' and public.has_admin_permission('manage_ads')) with check (bucket_id = 'ad-images' and public.has_admin_permission('manage_ads'));
create policy "Ad admins can delete ad images" on storage.objects for delete to authenticated using (bucket_id = 'ad-images' and public.has_admin_permission('manage_ads'));
