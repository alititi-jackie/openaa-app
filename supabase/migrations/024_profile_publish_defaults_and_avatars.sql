alter table public.profiles
  add column if not exists default_publish_contact_name text,
  add column if not exists publish_email_mode text not null default 'hidden',
  add column if not exists publish_email citext;

alter table public.profiles
  drop constraint if exists profiles_publish_email_mode_check;

alter table public.profiles
  add constraint profiles_publish_email_mode_check
  check (publish_email_mode in ('hidden', 'account', 'custom'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
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
      and policyname = 'Public can read avatars'
  ) then
    create policy "Public can read avatars"
      on storage.objects
      for select
      using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload own avatar'
  ) then
    create policy "Users can upload own avatar"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update own avatar'
  ) then
    create policy "Users can update own avatar"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete own avatar'
  ) then
    create policy "Users can delete own avatar"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
