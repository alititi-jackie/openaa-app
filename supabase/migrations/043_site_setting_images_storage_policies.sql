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

drop policy if exists "Public can read site setting images" on storage.objects;
drop policy if exists "Admins can upload site setting images" on storage.objects;
drop policy if exists "Admins can update site setting images" on storage.objects;
drop policy if exists "Admins can delete site setting images" on storage.objects;

create policy "Public can read site setting images"
  on storage.objects
  for select
  using (bucket_id = 'site-setting-images');

create policy "Admins can upload site setting images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-setting-images'
    and public.has_admin_permission('manage_settings')
  );

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

create policy "Admins can delete site setting images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'site-setting-images'
    and public.has_admin_permission('manage_settings')
  );
