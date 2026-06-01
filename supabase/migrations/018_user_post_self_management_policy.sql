drop policy if exists "Authors can update active own posts" on public.posts;

create policy "Authors can update active own posts"
  on public.posts
  for update
  to authenticated
  using (
    auth.uid() = author_id
    and status in ('draft', 'pending_review', 'published', 'hidden', 'expired')
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.status in ('active', 'restricted')
    )
  )
  with check (
    auth.uid() = author_id
    and status in ('draft', 'pending_review', 'published', 'hidden', 'expired', 'deleted')
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.status in ('active', 'restricted')
    )
  );
