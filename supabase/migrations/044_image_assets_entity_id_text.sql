alter table public.image_assets
  alter column entity_id type text
  using entity_id::text;
