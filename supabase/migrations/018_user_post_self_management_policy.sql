drop policy if exists "Authors can update active own posts" on public.posts;

create policy "Authors can update active own posts"
  on public.posts
  for update
  to authenticated
  using (
    auth.uid() = author_id
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.status = 'active'
          and posts.status in ('draft', 'pending_review', 'published', 'hidden', 'expired')
      )
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.status = 'restricted'
          and posts.status in ('draft', 'pending_review', 'published', 'expired')
      )
    )
  )
  with check (
    auth.uid() = author_id
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.status = 'active'
          and posts.status in ('draft', 'pending_review', 'published', 'hidden', 'expired', 'deleted')
      )
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.status = 'restricted'
          and posts.status in ('draft', 'pending_review', 'published', 'expired', 'deleted')
      )
    )
  );
