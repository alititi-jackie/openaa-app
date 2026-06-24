-- Allow ads managers to maintain the single global ad placeholder setting.
-- Other site_settings rows remain governed by the existing manage_settings policy.

create policy "Ads admins can manage default ad placeholder setting"
on public.site_settings
for all
using (
  key = 'default_ad_placeholder_image'
  and public.has_admin_permission('manage_ads')
)
with check (
  key = 'default_ad_placeholder_image'
  and public.has_admin_permission('manage_ads')
);
