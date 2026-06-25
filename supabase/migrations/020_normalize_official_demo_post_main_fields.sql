do $migration$
begin
  update public.posts as p
  set
    category = coalesce(h.housing_type, p.category),
    subcategory = coalesce(h.listing_type, p.subcategory),
    updated_at = now(),
    metadata = coalesce(p.metadata, '{}'::jsonb) || jsonb_build_object(
      'demo_main_fields_normalized_at', now()
    )
  from public.post_details_housing as h
  where h.post_id = p.id
    and p.post_type = 'housing'
    and p.metadata ->> 'demo_batch' = 'official_launch_2026_06'
    and p.metadata ->> 'official_demo' = 'true';

  update public.posts as p
  set
    category = coalesce(m.item_category, p.category),
    subcategory = coalesce(m.listing_type, p.subcategory),
    updated_at = now(),
    metadata = coalesce(p.metadata, '{}'::jsonb) || jsonb_build_object(
      'demo_main_fields_normalized_at', now()
    )
  from public.post_details_marketplace as m
  where m.post_id = p.id
    and p.post_type = 'marketplace'
    and p.metadata ->> 'demo_batch' = 'official_launch_2026_06'
    and p.metadata ->> 'official_demo' = 'true';

  update public.posts as p
  set
    category = coalesce(s.service_category, p.category),
    subcategory = null,
    updated_at = now(),
    metadata = coalesce(p.metadata, '{}'::jsonb) || jsonb_build_object(
      'demo_main_fields_normalized_at', now()
    )
  from public.post_details_services as s
  where s.post_id = p.id
    and p.post_type = 'service'
    and p.metadata ->> 'demo_batch' = 'official_launch_2026_06'
    and p.metadata ->> 'official_demo' = 'true';
end $migration$;
