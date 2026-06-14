insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-setting-images',
  'site-setting-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read site setting images'
  ) then
    create policy "Public can read site setting images"
      on storage.objects
      for select
      using (bucket_id = 'site-setting-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can upload site setting images'
  ) then
    create policy "Admins can upload site setting images"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'site-setting-images'
        and public.has_admin_permission('manage_settings')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can update site setting images'
  ) then
    create policy "Admins can update site setting images"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'site-setting-images'
        and public.has_admin_permission('manage_settings')
      )
      with check (
        bucket_id = 'site-setting-images'
        and public.has_admin_permission('manage_settings')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can delete site setting images'
  ) then
    create policy "Admins can delete site setting images"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'site-setting-images'
        and public.has_admin_permission('manage_settings')
      );
  end if;
end $$;

insert into public.site_settings (key, value, description, is_public)
values
  (
    'default_marketplace_placeholder_image',
    '{"url": null, "imageAssetId": null, "sourceType": null}'::jsonb,
    '二手信息没有用户上传图片时使用的默认占位图片。',
    true
  ),
  (
    'default_service_placeholder_image',
    '{"url": null, "imageAssetId": null, "sourceType": null}'::jsonb,
    '本地服务信息没有用户上传图片时使用的默认占位图片。',
    true
  )
on conflict (key) do update
set
  value = public.site_settings.value,
  description = excluded.description,
  is_public = true;
