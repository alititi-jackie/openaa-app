do $migration$
begin
  update public.posts as p
  set
    category = coalesce(j.job_category, p.category),
    subcategory = 'hiring',
    updated_at = now(),
    metadata = coalesce(p.metadata, '{}'::jsonb) || jsonb_build_object(
      'demo_visibility_fixed_at', now(),
      'demo_visibility_fix', 'job_category_and_mode_normalized'
    )
  from public.post_details_jobs as j
  where j.post_id = p.id
    and p.post_type = 'job'
    and p.metadata ->> 'demo_batch' = 'official_launch_2026_06'
    and p.metadata ->> 'official_demo' = 'true';
end $migration$;
