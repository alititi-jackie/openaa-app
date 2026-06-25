-- Fix legacy ad click-through URLs imported from OpenAA NY that point to
-- /nav/dmv, a route not implemented in openaa-app. Keep the ads and point
-- them to the existing DMV section instead.

update public.ads
set
  href = '/dmv',
  external_url = '/dmv',
  updated_at = now()
where href in ('https://openaa.com/nav/dmv', '/nav/dmv')
   or external_url in ('https://openaa.com/nav/dmv', '/nav/dmv');
