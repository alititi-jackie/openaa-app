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
  where post_type = 'marketplace'
    and metadata ->> 'demo_batch' = v_batch;

  create temp table tmp_demo_marketplace (
    demo_key text primary key,
    title text not null,
    body text not null,
    summary text not null,
    subcategory text,
    item_category text,
    listing_type text,
    condition text,
    price_amount numeric,
    negotiable boolean,
    trade_area text,
    delivery_options text[],
    age_days integer,
    view_count integer
  ) on commit drop;

  insert into tmp_demo_marketplace values
  ('marketplace_flushing_sofa', '法拉盛九成新三人沙发 出租屋升级转让', $$三人布艺沙发，深灰色，坐感偏硬，家里一直铺沙发垫使用，整体干净无明显污渍。因为搬家换小户型，客厅放不下所以转让。适合公寓客厅或办公室休息区，需自取，可协助搬到楼下。$$, '九成新三人沙发，法拉盛自取，可协助下楼。', '家具家电', '家具家电', 'selling', '九成新', 180, true, 'Flushing, NY', array['自取', '可协助搬运到楼下'], 1, 96),
  ('marketplace_brooklyn_bed', 'Brooklyn Queen Size 床架加床垫', $$Queen size 木质床架加床垫一起转让，床架稳固，床垫中等偏硬，适合刚搬家临时添置。使用约一年半，平时有保护套。因回国处理家具，价格已经按整套出。Brooklyn 八大道附近自取。$$, 'Queen 床架加床垫整套转让，适合搬家入住。', '家具家电', '家具家电', 'selling', '使用过，保持良好', 260, true, 'Brooklyn, NY', array['自取'], 3, 82),
  ('marketplace_queens_dining_set', 'Queens 小户型餐桌四椅一套', $$木纹餐桌配四把椅子，尺寸适合公寓厨房或小餐厅。桌面有轻微使用痕迹，不影响使用，椅子结构稳。家里换大桌所以转让。Elmhurst 附近自取，周末时间较方便。$$, '小户型餐桌四椅，结构稳，适合公寓。', '家具家电', '家具家电', 'selling', '正常使用痕迹', 120, true, 'Elmhurst, Queens, NY', array['自取'], 7, 74),
  ('marketplace_la_fridge', '洛杉矶单门冰箱 适合套房或办公室', $$白色单门冰箱，冷藏冷冻都正常，容量适合套房、办公室或出租房备用。外观有轻微刮痕，但运行安静。搬家后用不上，Koreatown 附近可看。需自取，有电梯。$$, '单门冰箱功能正常，适合套房或办公室。', '家具家电', '家具家电', 'selling', '功能正常', 150, true, 'Koreatown, Los Angeles, CA', array['自取', '电梯楼'], 15, 91),
  ('marketplace_san_gabriel_washer', 'San Gabriel 洗衣机转让 状态稳定', $$家用上开盖洗衣机，洗涤和脱水都正常，家庭使用约三年。因新房已有洗衣机所以转让。机器较重，需要买家自行安排搬运。San Gabriel 近 Valley Blvd，可预约试机。$$, '家用洗衣机，功能正常，可预约试机。', '家具家电', '家具家电', 'selling', '使用过，功能正常', 220, true, 'San Gabriel, CA', array['自取', '可现场试机'], 30, 67),
  ('marketplace_irvine_bike', 'Irvine 通勤自行车 适合学生上课买菜', $$通勤自行车，车况良好，刹车和变速正常。平时主要在小区和校园附近骑，车身有正常小刮痕。适合 UCI 学生或附近上班族短途代步。可在 Irvine Spectrum 附近交易。$$, '通勤自行车，刹车变速正常，适合短途代步。', '运动户外', '生活用品', 'selling', '正常使用', 95, false, 'Irvine, CA', array['当面交易'], 3, 112),
  ('marketplace_sf_tv', 'San Francisco 43 寸智能电视', $$43 寸智能电视，可连 Wi-Fi，看 YouTube、Netflix 等应用正常。屏幕无裂痕，遥控器在。因搬家换投影所以转让。Sunset 区自取，包装盒已丢，建议开车来取。$$, '43 寸智能电视，屏幕正常，带遥控器。', '电子产品', '电子产品', 'selling', '保持良好', 170, true, 'San Francisco, CA', array['自取'], 7, 125),
  ('marketplace_seattle_office_desk', 'Seattle 升降办公桌 适合居家办公', $$白色电动升降桌，桌面宽，适合电脑办公或学习。升降功能正常，桌面有少量使用痕迹。Bellevue 附近自取，桌腿可拆，SUV 基本可以放下。$$, '电动升降办公桌，适合居家办公。', '办公用品', '办公用品', 'selling', '使用过，状态良好', 240, true, 'Bellevue, WA', array['自取', '可拆装'], 1, 138),
  ('marketplace_houston_baby_stroller', 'Houston 婴儿推车加安全座椅', $$婴儿推车和 infant car seat 一套，家里孩子长大后闲置。推车折叠顺畅，安全座椅无事故记录，适合短期过渡或备用。Sugar Land 附近当面交易，欢迎看实物。$$, '婴儿推车加安全座椅，适合短期备用。', '母婴用品', '母婴用品', 'selling', '使用过，干净', 160, true, 'Sugar Land, Houston, TX', array['当面交易'], 15, 79),
  ('marketplace_jersey_city_car', 'Jersey City 2014 Toyota Camry 自用车', $$2014 Toyota Camry LE，自用通勤车，里程约 108k miles，保养正常，冷暖空调都好用。车身有小刮痕，适合通勤、买菜或新手练车。可提供 VIN 供查询，欢迎认真买家预约看车。$$, '2014 Camry 自用车，保养正常，适合通勤。', '汽车', '其它二手', 'selling', '自用车，正常使用', 7200, true, 'Jersey City, NJ', array['当面看车'], 7, 144),
  ('marketplace_boston_bookshelf', 'Boston Quincy 书架和文件柜转让', $$书架和两层文件柜一起转让，适合学生公寓或小办公室。整体稳固，外观有轻微使用痕迹。Quincy 附近自取，东西不重，一个人基本可以搬动。$$, '书架和文件柜，适合学生房或小办公室。', '办公用品', '办公用品', 'selling', '正常使用痕迹', 65, true, 'Quincy, MA', array['自取'], 3, 58),
  ('marketplace_chicago_microwave', 'Chicago Chinatown 微波炉 小家庭适用', $$中号微波炉，热饭热菜都正常，内胆干净。因为搬家合并家具，低价转让。适合学生、出租房或办公室使用。Chinatown 附近当面交易。$$, '中号微波炉，功能正常，适合出租房。', '家具家电', '家具家电', 'selling', '功能正常', 45, false, 'Chicago, IL', array['当面交易'], 1, 86),
  ('marketplace_atlanta_printer', 'Atlanta Duluth 家用打印机 扫描复印正常', $$HP 家用打印机，支持打印、扫描和复印，机器功能正常。墨盒还有一部分，适合家庭作业、文件打印或小办公室备用。Duluth 附近可试机后交易。$$, 'HP 家用打印机，扫描复印正常，可试机。', '电子产品', '电子产品', 'selling', '保持良好', 80, true, 'Duluth, Atlanta, GA', array['当面交易', '可试机'], 15, 71),
  ('marketplace_ny_luggage', '纽约 28 寸行李箱 两个一起出', $$两个 28 寸行李箱一起转让，一个深蓝一个灰色，轮子和拉杆都正常。适合搬家、回国或短期旅行备用。外壳有正常托运痕迹，不影响使用。曼哈顿下城可自取。$$, '两个 28 寸行李箱一起出，轮子拉杆正常。', '生活用品', '生活用品', 'selling', '正常使用痕迹', 70, true, 'Lower Manhattan, NY', array['自取'], 30, 63),
  ('marketplace_remote_wanted_monitor', '求购 27 寸显示器 纽约或新泽西可取', $$想求购一台 27 寸显示器，用于居家办公，品牌不限，希望屏幕无坏点、接口正常。有支架或 HDMI 线更好。纽约 Queens、Brooklyn 或 New Jersey 近 PATH 区域都可以约时间自取。$$, '求购 27 寸显示器，屏幕无坏点即可。', '求购', '电子产品', 'buying', '求购', 120, true, 'New York / New Jersey', array['自取', '当面交易'], 1, 101);

  create temp table tmp_demo_marketplace_posts on commit drop as
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
      'marketplace'::public.post_type,
      title,
      summary,
      body,
      'marketplace',
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
        'demo_category', 'marketplace',
        'demo_key', demo_key,
        'source', 'openaa_official_original',
        'city_display', trade_area
      )
    from tmp_demo_marketplace
    returning id, title, metadata
  )
  select i.id as post_id, m.*
  from inserted i
  join tmp_demo_marketplace m on i.metadata ->> 'demo_key' = m.demo_key;

  insert into public.post_details_marketplace (
    post_id,
    condition,
    delivery_options,
    item_category,
    listing_type,
    negotiable,
    price_amount,
    sold_at,
    trade_area
  )
  select
    post_id,
    condition,
    delivery_options,
    item_category,
    listing_type,
    negotiable,
    price_amount,
    null,
    trade_area
  from tmp_demo_marketplace_posts;

  insert into public.post_contacts (
    post_id,
    contact_name,
    phone,
    wechat,
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
    'demo@openaa.com',
    null,
    now(),
    now()
  from tmp_demo_marketplace_posts;

  insert into public.post_views (
    post_id,
    visitor_id,
    user_agent,
    created_at
  )
  select
    post_id,
    'official-demo-' || demo_key || '-' || gs::text,
    'OpenAA official demo seed',
    now() - make_interval(days => age_days) + make_interval(mins => gs)
  from tmp_demo_marketplace_posts
  cross join lateral generate_series(1, view_count) as gs;

  perform public.refresh_post_stats(post_id)
  from tmp_demo_marketplace_posts;
end $migration$;
