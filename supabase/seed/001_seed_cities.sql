insert into public.cities (
  slug,
  name,
  state_code,
  country_code,
  timezone,
  is_default,
  is_active,
  sort_order,
  metadata
)
values (
  'ny',
  '纽约',
  'NY',
  'US',
  'America/New_York',
  true,
  true,
  10,
  '{"display_locale":"zh-CN"}'::jsonb
)
on conflict (slug) do nothing;
