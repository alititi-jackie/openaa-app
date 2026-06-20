alter table public.image_assets
  drop constraint if exists image_assets_external_https_check;

alter table public.image_assets
  add constraint image_assets_external_https_check check (
    source_type <> 'external'
    or (
      external_url ~* '^https://'
      and (
        lower(external_host) = 'img.openaa.com'
        or lower(external_host) ~ '^[a-z0-9-]+\.supabase\.co$'
      )
    )
  );

delete from public.ads;

with legacy_ads(
  placement,
  image_url,
  external_url,
  open_mode,
  starts_at,
  ends_at,
  created_at,
  sort_order
) as (
  values
    ('home', 'https://img.openaa.com/img/banners/4bd57d0e-08dc-4f07-a8a2-96158193c569.webp', 'https://openaa.com/news', 'external_same', null::timestamptz, null::timestamptz, '2026-05-10T19:20:31.295881+00:00'::timestamptz, 0),
    ('home', 'https://img.openaa.com/img/banners/fb592415-540c-4cfa-ac66-161876571940.webp', 'https://openaa.com/services', 'external_same', null::timestamptz, '2027-12-10T14:55:00+00:00'::timestamptz, '2026-05-10T18:55:47.288716+00:00'::timestamptz, 1),
    ('home', 'https://img.openaa.com/img/banners/5c6006d2-b716-43b4-98e7-cc1761718a48.webp', 'https://openaa.com/jobs', 'external_same', null::timestamptz, '2026-12-10T14:38:00+00:00'::timestamptz, '2026-05-10T18:38:08.066513+00:00'::timestamptz, 2),
    ('jobs', 'https://img.openaa.com/img/banners/4bd57d0e-08dc-4f07-a8a2-96158193c569.png', 'https://openaa.com/news', 'external_same', null::timestamptz, '2027-12-10T14:54:00+00:00'::timestamptz, '2026-05-10T18:54:35.11789+00:00'::timestamptz, 0),
    ('jobs', 'https://img.openaa.com/img/banners/1fe24ddc-ba0e-4b39-9319-04167f139d29.png', 'https://openaa.com/nav/dmv', 'external_same', null::timestamptz, '2027-12-10T14:51:00+00:00'::timestamptz, '2026-05-10T18:52:03.74349+00:00'::timestamptz, 1),
    ('jobs', 'https://img.openaa.com/img/banners/1215d9b3-f38c-4173-ad87-aa0792690bd8.png', 'https://openaa.com/secondhand', 'external_same', null::timestamptz, '2027-12-10T14:50:00+00:00'::timestamptz, '2026-05-10T18:50:42.56459+00:00'::timestamptz, 2),
    ('jobs', 'https://img.openaa.com/img/banners/6e374654-6816-4da8-9736-bd374ea70b04.png', 'https://openaa.com/', 'external_same', null::timestamptz, '2027-12-10T14:46:00+00:00'::timestamptz, '2026-05-10T18:46:54.942571+00:00'::timestamptz, 3),
    ('housing', 'https://img.openaa.com/img/banners/0026e90b-6c28-4674-838e-986546de21a9.png', 'https://openaa.com/news', 'external_new', null::timestamptz, '2027-12-10T15:04:00+00:00'::timestamptz, '2026-05-10T19:05:33.157301+00:00'::timestamptz, 0),
    ('housing', 'https://img.openaa.com/img/banners/1215d9b3-f38c-4173-ad87-aa0792690bd8.png', 'https://openaa.com/secondhand', 'external_same', null::timestamptz, '2027-12-10T14:59:00+00:00'::timestamptz, '2026-05-10T19:00:32.063254+00:00'::timestamptz, 1),
    ('housing', 'https://img.openaa.com/img/banners/ed34e822-4982-40ec-90d1-adbbcbfb13b7.png', 'https://openaa.com/jobs', 'external_same', null::timestamptz, '2026-12-28T21:09:00+00:00'::timestamptz, '2026-04-29T01:09:56.258057+00:00'::timestamptz, 2),
    ('housing', 'https://img.openaa.com/img/news/6e374654-6816-4da8-9736-bd374ea70b04.png', 'https://openaa.com/', 'external_same', null::timestamptz, '2026-12-26T21:10:00+00:00'::timestamptz, '2026-04-27T01:10:58.886846+00:00'::timestamptz, 3),
    ('secondhand', 'https://img.openaa.com/img/banners/17588ab5-0248-47ae-a9a2-b0e02e06ea5b.png', 'https://openaa.com/services', 'external_same', null::timestamptz, null::timestamptz, '2026-05-10T19:10:58.074016+00:00'::timestamptz, 0),
    ('secondhand', 'https://img.openaa.com/img/banners/b720c8f2-d90c-451b-87fc-bec4179d7d61.png', 'https://openaa.com/jobs', 'external_same', null::timestamptz, '2027-12-10T15:07:00+00:00'::timestamptz, '2026-05-10T19:07:37.256403+00:00'::timestamptz, 1),
    ('secondhand', 'https://img.openaa.com/img/banners/5ecd92d7-6b42-4bc5-9237-2d1b85d83ec2.png', 'https://openaa.com/', 'external_same', null::timestamptz, '2026-12-09T17:43:00+00:00'::timestamptz, '2026-05-09T21:43:54.882079+00:00'::timestamptz, 2),
    ('navigation', 'https://img.openaa.com/img/banners/b720c8f2-d90c-451b-87fc-bec4179d7d61.png', 'https://openaa.com/jobs', 'external_same', null::timestamptz, '2026-12-26T16:11:00+00:00'::timestamptz, '2026-04-26T20:11:20.796304+00:00'::timestamptz, 0),
    ('navigation', 'https://img.openaa.com/img/banners/919b88a8-1ec1-4b2e-bbc6-d7a7eeaabbbb.png', 'http://numbermobi.com/', 'external_new', null::timestamptz, '2026-12-26T13:38:00+00:00'::timestamptz, '2026-04-26T17:38:45.119579+00:00'::timestamptz, 1),
    ('navigation', 'https://img.openaa.com/img/banners/0026e90b-6c28-4674-838e-986546de21a9.png', 'https://openaa.com/', 'external_same', null::timestamptz, '2026-12-26T13:23:00+00:00'::timestamptz, '2026-04-26T17:23:38.889535+00:00'::timestamptz, 2),
    ('services', 'https://img.openaa.com/img/banners/af1cf36f-b523-4b76-90f9-0e623631411f.png', 'https://openaa.com/nav/dmv', 'external_same', null::timestamptz, null::timestamptz, '2026-05-10T19:17:24.06022+00:00'::timestamptz, 0),
    ('services', 'https://img.openaa.com/img/banners/4cbbab1c-a91d-4414-9889-97a8844b1e24.png', 'https://openaa.com/secondhand', 'external_same', null::timestamptz, null::timestamptz, '2026-05-10T19:16:03.152662+00:00'::timestamptz, 1),
    ('services', 'https://img.openaa.com/img/banners/5ecd92d7-6b42-4bc5-9237-2d1b85d83ec2.png', 'https://openaa.com/', 'external_same', null::timestamptz, null::timestamptz, '2026-05-10T19:14:42.27445+00:00'::timestamptz, 2),
    ('services', 'https://qqrrvbqtbxatrpfxtpil.supabase.co/storage/v1/object/public/ads/ads/1778105681723.png', 'https://numbermobi.com/', 'external_new', null::timestamptz, null::timestamptz, '2026-05-06T22:14:42.182861+00:00'::timestamptz, 3),
    ('services', 'https://qqrrvbqtbxatrpfxtpil.supabase.co/storage/v1/object/public/ads/ads/1778105597680.png', 'https://openaa.com/', 'external_same', null::timestamptz, '2026-12-06T18:08:00+00:00'::timestamptz, '2026-05-06T22:13:18.889381+00:00'::timestamptz, 4),
    ('news', 'https://img.openaa.com/img/banners/5c6006d2-b716-43b4-98e7-cc1761718a48.png', 'https://openaa.com/jobs', 'external_same', null::timestamptz, null::timestamptz, '2026-05-10T19:19:35.195469+00:00'::timestamptz, 0),
    ('news', 'https://img.openaa.com/img/banners/af1cf36f-b523-4b76-90f9-0e623631411f.png', 'https://openaa.com/nav/dmv', 'external_same', null::timestamptz, null::timestamptz, '2026-05-10T19:18:31.366069+00:00'::timestamptz, 1),
    ('news', 'https://img.openaa.com/img/banners/6e374654-6816-4da8-9736-bd374ea70b04.png', 'https://openaa.com/', 'external_same', null::timestamptz, '2026-12-08T20:31:00+00:00'::timestamptz, '2026-05-09T00:31:48.024058+00:00'::timestamptz, 2),
    ('news', 'https://img.openaa.com/img/banners/7cb4ef79-58f2-4cbb-9bbc-7d9eb90c9479.png', 'https://numbermobi.com/', 'external_new', null::timestamptz, '2026-12-08T20:30:00+00:00'::timestamptz, '2026-05-09T00:30:36.744805+00:00'::timestamptz, 3),
    ('dmv', 'https://img.openaa.com/img/banners/ed34e822-4982-40ec-90d1-adbbcbfb13b7.png', 'https://openaa.com/housing', 'external_same', null::timestamptz, '2027-12-10T14:48:00+00:00'::timestamptz, '2026-05-10T18:49:01.756376+00:00'::timestamptz, 0),
    ('dmv', 'https://img.openaa.com/img/banners/17588ab5-0248-47ae-a9a2-b0e02e06ea5b.png', 'https://openaa.com/services', 'external_same', null::timestamptz, '2026-12-10T14:43:00+00:00'::timestamptz, '2026-05-10T18:43:32.530821+00:00'::timestamptz, 1),
    ('dmv', 'https://img.openaa.com/img/banners/4bd57d0e-08dc-4f07-a8a2-96158193c569.png', 'https://openaa.com/news', 'external_same', null::timestamptz, '2026-12-09T22:40:00+00:00'::timestamptz, '2026-05-10T02:40:44.60478+00:00'::timestamptz, 2),
    ('dmv', 'https://img.openaa.com/img/banners/1215d9b3-f38c-4173-ad87-aa0792690bd8.png', 'https://openaa.com/secondhand', 'external_same', null::timestamptz, '2026-12-09T18:34:00+00:00'::timestamptz, '2026-05-09T22:34:21.445055+00:00'::timestamptz, 3),
    ('dmv', 'https://img.openaa.com/img/banners/af1cf36f-b523-4b76-90f9-0e623631411f.png', 'https://openaa.com/nav/dmv', 'external_same', null::timestamptz, '2026-12-09T17:46:00+00:00'::timestamptz, '2026-05-09T21:46:10.983729+00:00'::timestamptz, 4)
),
prepared as (
  select
    gen_random_uuid() as ad_id,
    gen_random_uuid() as image_asset_id,
    placement,
    image_url,
    external_url,
    open_mode,
    starts_at,
    ends_at,
    created_at,
    sort_order,
    lower((regexp_match(image_url, '^https://([^/]+)'))[1]) as image_host
  from legacy_ads
),
inserted_images as (
  insert into public.image_assets (
    id,
    source_type,
    external_url,
    external_host,
    entity_type,
    entity_id,
    status,
    is_public,
    metadata,
    created_at,
    updated_at
  )
  select
    image_asset_id,
    'external'::public.image_source_type,
    image_url,
    image_host,
    'ad',
    ad_id::text,
    'active',
    true,
    jsonb_build_object('source', 'legacy_openaa_ny_public_ads_import'),
    created_at,
    now()
  from prepared
  returning id
)
insert into public.ads (
  id,
  placement,
  title,
  href,
  image_asset_id,
  is_active,
  starts_at,
  ends_at,
  sort_order,
  metadata,
  created_at,
  updated_at,
  open_mode,
  link_type,
  external_url,
  slug,
  content,
  contact_name,
  phone,
  wechat,
  deleted_at,
  deleted_by
)
select
  ad_id,
  placement,
  external_url,
  external_url,
  image_asset_id,
  true,
  starts_at,
  ends_at,
  sort_order,
  jsonb_build_object('source', 'legacy_openaa_ny_public_ads_import'),
  created_at,
  now(),
  open_mode,
  'external',
  external_url,
  null,
  null,
  null,
  null,
  null,
  null,
  null
from prepared;
