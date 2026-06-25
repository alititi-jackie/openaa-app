-- Fix legacy OpenAA NY navigation category links that point to routes
-- not implemented in openaa-app. Keep records and redirect them to
-- existing destinations instead of leaving public 404 links.

update public.navigation_links
set
  url = '/dmv',
  updated_at = now()
where id = 'c0bac054-ad52-4fde-a667-3b4414be7319'
  and url in ('https://openaa.com/nav/dmv', '/nav/dmv');

update public.navigation_links
set
  url = '/navigation#navigation-finance',
  updated_at = now()
where id = '5b257e4d-99a1-4778-a229-d32081210da1'
  and url in ('https://openaa.com/nav/bank', '/nav/bank');

update public.navigation_links
set
  url = '/navigation#navigation-shopping',
  updated_at = now()
where id = 'bbb34abf-de2e-4d76-929d-586127928e01'
  and url in ('https://openaa.com/nav/onegobuy', '/nav/onegobuy');

update public.navigation_links
set
  url = '/navigation#navigation-ai',
  updated_at = now()
where id = 'de9cb5f0-f04c-44c0-aa9a-8789636f8851'
  and url in ('https://openaa.com/nav/ai', '/nav/ai');
