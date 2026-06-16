drop policy if exists "Messages admins can handle support tickets" on public.support_tickets;
create policy "Messages admins can handle support tickets"
  on public.support_tickets
  for update
  to authenticated
  using (
    public.has_admin_module('messages')
    or (deleted_at is not null and public.has_admin_module('recycle-bin'))
  )
  with check (
    public.has_admin_module('messages')
    or public.has_admin_module('recycle-bin')
  );

drop policy if exists "Messages admins can manage post reports" on public.post_reports;
create policy "Messages admins can manage post reports"
  on public.post_reports
  for all
  to authenticated
  using (
    public.has_admin_module('messages')
    or (deleted_at is not null and public.has_admin_module('recycle-bin'))
  )
  with check (
    public.has_admin_module('messages')
    or public.has_admin_module('recycle-bin')
  );
