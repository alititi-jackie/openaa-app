insert into public.site_settings (key, value, description, is_public)
values
  (
    'domain_strategy',
    '{"appDomain":"openaa.com","primarySeoDomain":"openaa.com","canonicalBaseUrl":"https://openaa.com","allowedDomains":["openaa.com"],"redirectDomains":["www.openaa.com","app.openaa.com","openaa.cn","www.openaa.cn","openaa.app","www.openaa.app"]}'::jsonb,
    'Canonical and domain strategy for OpenAA.',
    true
  ),
  (
    'dmv_disclaimer',
    '{"text":"OpenAA 绾界害 DMV 涓枃缁冧範棰樺簱锛屼粎渚涘涔犲弬鑰冿紝瀹為檯鑰冭瘯鍐呭浠?New York DMV 瀹樻柟璧勬枡涓哄噯銆?}'::jsonb,
    'Public DMV disclaimer copy.',
    true
  )
on conflict (key) do nothing;
