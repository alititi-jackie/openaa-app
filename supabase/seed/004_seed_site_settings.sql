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
  )
on conflict (key) do nothing;
