drop policy if exists "Admins can read support ticket settings" on public.support_ticket_settings;
drop policy if exists "Admins can manage support ticket settings" on public.support_ticket_settings;
drop policy if exists "Admins can read support ticket events" on public.support_ticket_events;

create policy "Messages admins can read support ticket settings"
  on public.support_ticket_settings
  for select
  to authenticated
  using (public.has_admin_module('messages'));

create policy "Messages admins can manage support ticket settings"
  on public.support_ticket_settings
  for update
  to authenticated
  using (public.has_admin_module('messages'))
  with check (public.has_admin_module('messages'));

create policy "Messages admins can read support ticket events"
  on public.support_ticket_events
  for select
  to authenticated
  using (public.has_admin_module('messages'));
