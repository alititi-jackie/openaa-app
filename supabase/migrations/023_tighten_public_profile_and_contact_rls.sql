create or replace function public.is_profile_publicly_allowed(p_user_id uuid)
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
      and p.status = 'active'
  );
$$;

drop policy if exists "Public can read contacts for public posts" on public.post_contacts;

create policy "Public can read contacts for public posts"
  on public.post_contacts
  for select
  to anon, authenticated
  using (public.is_public_post(post_id));
