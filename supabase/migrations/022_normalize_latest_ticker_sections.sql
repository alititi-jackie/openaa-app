-- Keep the home latest ticker configuration limited to the five public content channels.
insert into public.latest_ticker_sections (section_key, section_name, is_enabled, sort_order, display_count)
values
  ('news', '新闻', true, 10, 5),
  ('jobs', '招聘', true, 20, 3),
  ('housing', '房屋', true, 30, 3),
  ('marketplace', '二手', true, 40, 3),
  ('services', '本地服务', true, 50, 3)
on conflict (section_key) do update
set section_name = excluded.section_name;

delete from public.latest_ticker_sections
where section_key not in ('news', 'jobs', 'housing', 'marketplace', 'services');
