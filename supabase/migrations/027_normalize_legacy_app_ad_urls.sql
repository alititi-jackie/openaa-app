-- Normalize legacy OpenAA app-host ad URLs to the public production domain.
update public.ads
set
  title = case
    when title = 'https://app.openaa.com/' then 'OpenAA'
    when title = 'https://app.openaa.com/jobs' then '招聘信息'
    when title = 'https://app.openaa.com/housing' then '房屋信息'
    when title = 'https://app.openaa.com/marketplace' then '二手信息'
    when title = 'https://app.openaa.com/services' then '本地服务'
    when title = 'https://app.openaa.com/news' then '新闻资讯'
    when title like 'https://app.openaa.com/%' then regexp_replace(title, '^https://app\.openaa\.com', 'https://openaa.com')
    else title
  end,
  href = case
    when href like 'https://app.openaa.com%' then regexp_replace(href, '^https://app\.openaa\.com', 'https://openaa.com')
    else href
  end,
  external_url = case
    when external_url like 'https://app.openaa.com%' then regexp_replace(external_url, '^https://app\.openaa\.com', 'https://openaa.com')
    else external_url
  end,
  updated_at = now()
where
  title like 'https://app.openaa.com%'
  or href like 'https://app.openaa.com%'
  or external_url like 'https://app.openaa.com%';
