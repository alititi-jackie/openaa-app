insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
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
      and policyname = 'Public can read post images'
  ) then
    create policy "Public can read post images"
      on storage.objects
      for select
      using (bucket_id = 'post-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload own post images'
  ) then
    create policy "Users can upload own post images"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'post-images'
        and (storage.foldername(name))[1] in ('job', 'housing', 'marketplace', 'service')
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update own post images'
  ) then
    create policy "Users can update own post images"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'post-images'
        and (storage.foldername(name))[1] in ('job', 'housing', 'marketplace', 'service')
        and (storage.foldername(name))[2] = auth.uid()::text
      )
      with check (
        bucket_id = 'post-images'
        and (storage.foldername(name))[1] in ('job', 'housing', 'marketplace', 'service')
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete own post images'
  ) then
    create policy "Users can delete own post images"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'post-images'
        and (storage.foldername(name))[1] in ('job', 'housing', 'marketplace', 'service')
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end $$;
