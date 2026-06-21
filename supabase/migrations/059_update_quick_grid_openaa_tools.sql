update public.home_sections
set
  config = jsonb_set(
    config,
    '{items}',
    (
      select jsonb_agg(
        case
          when item->>'label' = '新手指南'
            or item->>'href' = '/news?category=newcomer-guide'
          then item
            || jsonb_build_object(
              'label', 'OpenAA工具',
              'href', 'https://tools.openaa.com',
              'icon', 'wrench',
              'open_mode', 'new'
            )
          else item
        end
        order by ordinality
      )
      from jsonb_array_elements(config->'items') with ordinality as items(item, ordinality)
    )
  ),
  updated_at = now()
where key = 'quick_grid'
  and jsonb_typeof(config->'items') = 'array';
