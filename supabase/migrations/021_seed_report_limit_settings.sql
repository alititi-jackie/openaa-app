insert into public.site_settings (key, value, is_public, description)
values
  ('report_daily_user_limit', '{"limit":20}'::jsonb, false, 'Maximum post reports a signed-in user can submit per day.'),
  ('report_daily_visitor_limit', '{"limit":5}'::jsonb, false, 'Maximum post reports an anonymous visitor can submit per day.'),
  ('report_daily_ip_limit', '{"limit":50}'::jsonb, false, 'Maximum post reports one IP address can submit per day.'),
  ('report_daily_total_limit', '{"limit":200}'::jsonb, false, 'Maximum post reports the whole site can accept per day.')
on conflict (key) do update set
  value = coalesce(public.site_settings.value, excluded.value),
  is_public = false,
  description = excluded.description,
  updated_at = now();
