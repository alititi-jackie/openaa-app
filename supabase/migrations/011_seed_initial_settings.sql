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
on conflict (slug) do update
set
  name = excluded.name,
  state_code = excluded.state_code,
  country_code = excluded.country_code,
  timezone = excluded.timezone,
  is_default = excluded.is_default,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.site_settings (key, value, description, is_public)
values
  (
    'domain_strategy',
    '{"appDomain":"openaa.app","primarySeoDomain":"openaa.com","canonicalBaseUrl":"https://openaa.com","allowedDomains":["openaa.app","openaa.com","openaa.cn"],"redirectDomains":["openaa.cn"]}'::jsonb,
    'Canonical and domain strategy for OpenAA.',
    true
  ),
  (
    'dmv_disclaimer',
    '{"text":"OpenAA 纽约 DMV 中文练习题库，仅供学习参考，实际考试内容以 New York DMV 官方资料为准。"}'::jsonb,
    'Public DMV disclaimer copy.',
    true
  ),
  (
    'admin_bootstrap',
    '{"firstSuperAdminEmail":"fengjiancheng8@gmail.com","status":"manual-bootstrap-required"}'::jsonb,
    'Non-secret bootstrap note. Insert the first super_admin manually after the user signs up.',
    false
  )
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  is_public = excluded.is_public,
  updated_at = now();
