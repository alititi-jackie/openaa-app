insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ad-images',
  'ad-images',
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
      and policyname = 'Public can read ad images'
  ) then
    create policy "Public can read ad images"
      on storage.objects
      for select
      using (bucket_id = 'ad-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can upload ad images'
  ) then
    create policy "Admins can upload ad images"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'ad-images'
        and public.has_admin_permission('manage_ads')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can update ad images'
  ) then
    create policy "Admins can update ad images"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'ad-images'
        and public.has_admin_permission('manage_ads')
      )
      with check (
        bucket_id = 'ad-images'
        and public.has_admin_permission('manage_ads')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can delete ad images'
  ) then
    create policy "Admins can delete ad images"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'ad-images'
        and public.has_admin_permission('manage_ads')
      );
  end if;
end $$;
