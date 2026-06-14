drop policy if exists "Users can mark or soft delete own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

revoke update on public.notifications from anon, authenticated;

grant select on public.notifications to authenticated;

drop policy if exists "Users can read own non-deleted notifications" on public.notifications;
create policy "Users can read own non-deleted notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);
