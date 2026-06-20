drop policy if exists "Public can read active ads" on public.ads;

create policy "Public can read active ads"
  on public.ads
  for select
  using (
    deleted_at is null
    and is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );
