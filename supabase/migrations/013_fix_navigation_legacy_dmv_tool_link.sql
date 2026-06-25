-- Fix an inactive legacy DMV tool navigation link that points to an
-- unimplemented imported static page. Keep the record available for future
-- use, but point it to the current DMV tools section.

update public.navigation_links
set
  url = '/dmv#dmv-quick-tools-section',
  updated_at = now()
where url in (
  'https://openaa.com/tool/dmv/document-checker.html',
  '/tool/dmv/document-checker.html'
);
