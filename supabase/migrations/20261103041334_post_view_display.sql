begin;
insert into public.site_settings(key,value,is_public,description)
values ('post_view_display','{"detail":true,"list":true}',true,'招聘、房屋、二手、本地服务共用前台浏览量显示开关；不影响统计及后台。')
on conflict (key) do nothing;

create policy "Post moderators can update view display" on public.site_settings
for update to authenticated
using (key='post_view_display' and public.has_admin_module('user-posts') and public.has_admin_permission('moderate_posts'))
with check (key='post_view_display' and is_public=true and public.has_admin_module('user-posts') and public.has_admin_permission('moderate_posts'));
commit;
