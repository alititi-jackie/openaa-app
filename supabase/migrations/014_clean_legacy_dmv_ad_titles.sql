-- Clean imported legacy DMV ad titles so alt/aria text no longer exposes
-- the old /nav/dmv route after the click-through URL was fixed.

update public.ads
set
  title = 'DMV',
  updated_at = now()
where title in ('https://openaa.com/nav/dmv', '/nav/dmv', 'DMV ????')
  and (href = '/dmv' or external_url = '/dmv');
