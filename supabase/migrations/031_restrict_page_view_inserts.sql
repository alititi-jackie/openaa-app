-- Apply after the server-side page-view writer has been deployed.
-- The public endpoint validates origin, rate limits and bot user agents before inserting.
drop policy if exists "Public can insert site page views" on public.site_page_views;
revoke insert on public.site_page_views from anon, authenticated;
