do $migration$
declare
  v_author_id uuid;
  v_batch text := 'official_launch_2026_06';
begin
  select id into v_author_id
  from public.profiles
  where email = 'admin-test@openaa.com'
  limit 1;

  delete from public.posts
  where post_type = 'job'
    and metadata ->> 'demo_batch' = v_batch;

  create temp table tmp_demo_jobs (
    demo_key text primary key,
    title text not null,
    body text not null,
    summary text not null,
    subcategory text,
    work_area text,
    job_category text,
    employment_type text,
    employer_type text,
    wage_min numeric,
    wage_max numeric,
    wage_unit text,
    language_requirement text,
    experience_requirement text,
    requires_work_authorization boolean,
    includes_meals boolean,
    includes_housing boolean,
    age_days integer,
    view_count integer
  ) on commit drop;

  insert into tmp_demo_jobs values
  ('jobs_flushing_server', '法拉盛中餐馆诚聘晚班服务员', $$法拉盛中心地段中餐馆诚聘晚班服务员，主要负责点单、上菜、收桌和简单顾客沟通。工作环境稳定，团队以中文沟通为主，适合有餐馆经验或愿意长期稳定工作的朋友。需要做事利落、有责任心，周末可上班者优先。$$, '法拉盛中餐馆晚班服务员，环境稳定，可培训。', '餐馆服务', 'Flushing, NY', '服务员', 'full_time', 'restaurant', 18, 24, 'hour', '中文为主，简单英文', '有餐馆经验优先，可培训', true, true, false, 1, 86),
  ('jobs_brooklyn_bakery', 'Brooklyn 亚洲烘焙店请前台收银', $$Brooklyn 八大道附近烘焙店招聘前台收银，负责收银、打包、整理展示柜和接听电话订单。希望应聘者态度亲切，能适应早班，做事细心。店内客源稳定，同事好相处，适合住 Brooklyn 或通勤方便者。$$, '八大道烘焙店前台收银，早班为主。', '前台收银', 'Brooklyn, NY', '收银前台', 'part_time', 'bakery', 17, 21, 'hour', '中文，简单英文', '零售或收银经验优先', true, false, false, 3, 64),
  ('jobs_queens_nail_tech', 'Queens 美甲店招聘熟手美甲师', $$Queens 商圈美甲店招聘熟手美甲师，主要做 Gel、SNS、延长、基础护理等项目。店内客人稳定，小费情况良好。希望技术稳定、沟通耐心，能保持工作台整洁。有固定客源或会简单设计款者更佳。$$, 'Queens 美甲店请熟手美甲师，客源稳定。', '美容美甲', 'Queens, NY', '美甲师', 'full_time', 'salon', 1200, 1800, 'week', '中文或英文均可', '需要熟手经验', true, false, false, 7, 121),
  ('jobs_manhattan_office_assistant', '曼哈顿贸易公司办公室助理', $$曼哈顿中城贸易公司招聘办公室助理，负责文件整理、邮件回复、供应商沟通和简单数据录入。要求工作认真，熟悉 Excel 和基础英文邮件。适合希望从行政岗位开始积累美国办公室经验的求职者。$$, '曼哈顿贸易公司办公室助理，需基础英文和 Excel。', '办公室行政', 'New York, NY', '办公室助理', 'full_time', 'office', 22, 28, 'hour', '中英文', '1 年办公室经验优先', true, false, false, 15, 73),
  ('jobs_la_boba_barista', '洛杉矶奶茶店请全职吧台', $$Los Angeles 东区奶茶店招聘全职吧台，负责饮品制作、备料、收银和门店清洁。需动作快、讲卫生、能配合排班。有奶茶或咖啡店经验优先，无经验可培训。工作氛围年轻，适合长期稳定者。$$, '洛杉矶奶茶店全职吧台，无经验可培训。', '奶茶咖啡', 'Los Angeles, CA', '吧台', 'full_time', 'tea_shop', 18, 23, 'hour', '中文或英文', '有饮品经验优先', true, false, false, 3, 95),
  ('jobs_san_gabriel_kitchen', 'San Gabriel 中餐馆请炒锅/帮厨', $$San Gabriel 中餐馆招聘炒锅和帮厨，菜单稳定，厨房分工明确。炒锅需有相关经验，帮厨可培训。要求能吃苦、守时、注意厨房卫生。薪资按经验面议，表现好可长期合作。$$, 'San Gabriel 中餐馆请炒锅和帮厨，薪资按经验。', '餐馆厨房', 'San Gabriel, CA', '厨师帮厨', 'full_time', 'restaurant', 3800, 5600, 'month', '中文', '炒锅需经验，帮厨可培训', true, true, false, 7, 132),
  ('jobs_irvine_ecommerce', 'Irvine 电商公司招聘运营助理', $$Irvine 电商团队招聘运营助理，协助产品上架、订单跟进、客服回复和库存表维护。希望熟悉电脑操作，英文读写顺畅，做事有条理。了解 Amazon、Shopify 或小红书内容运营者优先。$$, 'Irvine 电商运营助理，适合细心稳定者。', '电商运营', 'Irvine, CA', '运营助理', 'full_time', 'ecommerce', 22, 30, 'hour', '中英文', '电商平台经验优先', true, false, false, 15, 58),
  ('jobs_sf_it_support', 'San Francisco 初级 IT Support', $$San Francisco 小型科技服务团队招聘初级 IT Support，负责电脑设置、账号权限、基础网络排查和客户工单跟进。要求英文沟通清楚，熟悉 Windows/Mac 基础操作，有 CompTIA 或相关实习经验更好。$$, '旧金山初级 IT Support，适合技术支持入门。', 'IT 技术', 'San Francisco, CA', 'IT Support', 'full_time', 'technology', 28, 38, 'hour', '英文为主，可中文沟通', '实习或 1 年经验优先', true, false, false, 30, 144),
  ('jobs_seattle_warehouse', 'Seattle 仓库招聘打包理货人员', $$Seattle 南区仓库招聘打包理货人员，负责拣货、打包、贴标、整理货架和简单库存记录。要求能搬动中等重量货物，工作认真，能按流程操作。白班为主，适合想找稳定工作的朋友。$$, 'Seattle 仓库打包理货，白班稳定。', '仓库物流', 'Seattle, WA', '仓库理货', 'full_time', 'warehouse', 20, 25, 'hour', '中文或英文', '仓库经验优先', true, false, false, 7, 89),
  ('jobs_houston_cdl_driver', 'Houston 招 CDL A 卡车司机', $$Houston 物流公司招聘 CDL A 卡车司机，主要跑 Texas 及周边州线路。要求驾照记录良好，安全意识强，能按时沟通货运状态。收入按线路和经验计算，适合有稳定驾驶经验者。$$, 'Houston CDL A 卡车司机，区域线路为主。', '司机物流', 'Houston, TX', '卡车司机', 'full_time', 'logistics', 1800, 2600, 'week', '英文基础沟通', 'CDL A 和驾驶经验必需', true, false, false, 15, 111),
  ('jobs_flushing_supermarket', '法拉盛华人超市请理货员', $$法拉盛华人超市招聘理货员，负责补货、标价、货架整理和协助顾客找商品。工作节奏稳定，需要能站立工作，做事主动。可安排全职或兼职，住附近者优先。$$, '法拉盛超市理货员，全职兼职均可。', '超市零售', 'Flushing, NY', '理货员', 'part_time', 'supermarket', 16, 20, 'hour', '中文', '有零售经验优先', true, false, false, 1, 77),
  ('jobs_ny_home_care', '纽约住家保姆照顾老人', $$纽约长岛家庭寻找住家保姆，主要照顾一位生活可自理老人，负责简单做饭、陪同散步、轻家务和提醒用药。要求有耐心，讲卫生，能长期稳定。每周休息一天，具体安排可面谈。$$, '长岛住家保姆，照顾老人和简单家务。', '保姆家政', 'Long Island, NY', '住家保姆', 'full_time', 'home_care', 4200, 5200, 'month', '中文', '照顾老人经验优先', true, true, true, 3, 103),
  ('jobs_brooklyn_massage', 'Brooklyn 正规按摩店请前台', $$Brooklyn 正规按摩店招聘前台，负责预约、接待、收银和店内日常协调。要求形象整洁，沟通耐心，能使用简单英文。工作环境正规安静，有相关前台或美容行业经验者优先。$$, 'Brooklyn 正规按摩店前台，环境安静稳定。', '前台接待', 'Brooklyn, NY', '前台', 'full_time', 'wellness', 18, 24, 'hour', '中文和简单英文', '前台经验优先', true, false, false, 30, 66),
  ('jobs_queens_cleaning', 'Queens 清洁公司招聘兼职清洁员', $$Queens 清洁公司招聘兼职清洁员，主要负责公寓退租清洁、办公室清洁和短租房整理。工作地点按单安排，需认真负责、能准时到达。有清洁经验和自备交通者优先。$$, 'Queens 清洁公司兼职清洁员，按单安排。', '清洁家政', 'Queens, NY', '清洁员', 'part_time', 'cleaning', 20, 28, 'hour', '中文或英文', '清洁经验优先', true, false, false, 15, 52),
  ('jobs_remote_bilingual_support', '双语客服助理 可远程办公', $$纽约注册的小型服务公司招聘双语客服助理，可远程办公。主要回复邮件、整理客户资料、预约回访和记录问题。要求中英文表达清楚，电脑操作熟练，工作时间稳定。适合有客服经验、希望灵活工作的求职者。$$, '双语客服助理，可远程，需稳定在线。', '客服支持', 'Remote / New York, NY', '客服助理', 'part_time', 'office', 19, 26, 'hour', '中英文', '客服经验优先', true, false, false, 1, 118);

  create temp table tmp_demo_job_posts on commit drop as
  with inserted as (
    insert into public.posts (
      author_id,
      city_id,
      post_type,
      title,
      summary,
      body,
      category,
      subcategory,
      status,
      visibility,
      published_at,
      created_at,
      updated_at,
      expires_at,
      metadata
    )
    select
      v_author_id,
      'ny',
      'job'::public.post_type,
      title,
      summary,
      body,
      'jobs',
      subcategory,
      'published'::public.post_status,
      'public'::public.post_visibility,
      now() - make_interval(days => age_days),
      now() - make_interval(days => age_days),
      now() - make_interval(days => age_days),
      now() + interval '90 days',
      jsonb_build_object(
        'official_demo', true,
        'demo_batch', v_batch,
        'demo_category', 'jobs',
        'demo_key', demo_key,
        'source', 'openaa_official_original',
        'city_display', work_area
      )
    from tmp_demo_jobs
    returning id, metadata
  )
  select
    i.id as post_id,
    j.*
  from inserted i
  join tmp_demo_jobs j on j.demo_key = i.metadata ->> 'demo_key';

  insert into public.post_details_jobs (
    post_id,
    employer_type,
    employment_type,
    experience_requirement,
    includes_housing,
    includes_meals,
    job_category,
    language_requirement,
    requires_work_authorization,
    wage_max,
    wage_min,
    wage_unit,
    work_area
  )
  select
    post_id,
    employer_type,
    employment_type,
    experience_requirement,
    includes_housing,
    includes_meals,
    job_category,
    language_requirement,
    requires_work_authorization,
    wage_max,
    wage_min,
    wage_unit,
    work_area
  from tmp_demo_job_posts;

  insert into public.post_contacts (
    post_id,
    contact_name,
    phone,
    wechat,
    whatsapp,
    email,
    preferred_contact_method,
    created_at,
    updated_at
  )
  select
    post_id,
    'OpenAA Official',
    '2125550188',
    'OpenAA_demo',
    null,
    'demo@openaa.com',
    null,
    now() - make_interval(days => age_days),
    now() - make_interval(days => age_days)
  from tmp_demo_job_posts;

  insert into public.post_views (post_id, visitor_id, user_agent, created_at)
  select
    post_id,
    'official-demo-' || demo_key || '-' || gs::text,
    'OpenAA official demo seed',
    (now() - make_interval(days => age_days)) + (gs * interval '37 minutes')
  from tmp_demo_job_posts
  cross join lateral generate_series(1, view_count) as gs;

  perform public.refresh_post_stats(post_id)
  from tmp_demo_job_posts;
end $migration$;
