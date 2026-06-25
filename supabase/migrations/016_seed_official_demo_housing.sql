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
  where post_type = 'housing'
    and metadata ->> 'demo_batch' = v_batch;

  create temp table tmp_demo_housing (
    demo_key text primary key,
    title text not null,
    body text not null,
    summary text not null,
    subcategory text,
    address_area text,
    housing_type text,
    listing_type text,
    rent_amount numeric,
    deposit_amount numeric,
    available_date date,
    lease_term text,
    pets_allowed boolean,
    utilities_included boolean,
    transit_nearby text,
    age_days integer,
    view_count integer
  ) on commit drop;

  insert into tmp_demo_housing values
  ('housing_flushing_single_room', '法拉盛中心单间出租 近地铁和超市', $$法拉盛缅街附近安静单间出租，步行可到 7 号线、华人超市和餐馆。房间采光好，适合一位上班族或学生居住。厨房、卫生间与室友共用，室友作息稳定，家中不吸烟。希望租客爱干净、少炊或简炊，长租优先。$$, '法拉盛中心单间，交通方便，适合上班族或学生。', '单间出租', 'Flushing, Queens, NY', '单间', 'rent', 980, 980, current_date + 7, '一年起租，可面谈', false, true, '步行约 8 分钟到 7 号线 Main St 站', 1, 136),
  ('housing_brooklyn_master_room', 'Brooklyn 八大道主卧带独卫出租', $$Brooklyn 八大道附近主卧出租，房间带独立卫生间，楼下购物、吃饭和公交都方便。房子为家庭式管理，公共区域保持整洁。适合正职人士或安静学生，要求无烟、无宠物、按时交租。可看房，入住时间可商量。$$, '八大道主卧带独卫，生活便利，适合安静租客。', '套房出租', 'Brooklyn, NY', '主卧带独卫', 'rent', 1450, 1450, current_date + 3, '6 个月起租', false, false, '近 N 线和多路公交', 3, 98),
  ('housing_queens_studio', 'Queens Elmhurst Studio 整租 可拎包入住', $$Elmhurst 近 Broadway 的 Studio 整租，室内有基本家具和小厨房，适合单人或情侣。附近有地铁、华人超市、洗衣店和餐馆，生活非常方便。房东希望租客收入稳定、保持房间整洁。水费包含，电网另付。$$, 'Elmhurst Studio 整租，家具齐，交通方便。', 'Studio', 'Elmhurst, Queens, NY', 'Studio', 'rent', 1850, 1850, current_date + 15, '一年租约', false, false, '近 M/R 地铁 Grand Ave 站', 7, 121),
  ('housing_manhattan_room', 'Manhattan Chinatown 次卧出租 近地铁', $$曼哈顿 Chinatown 公寓次卧出租，适合在市区上班或上学的租客。房间不大但位置好，步行可到地铁、超市和餐馆。室友人数少，公共区域维护干净。希望租客安静、无派对、按时交租。$$, 'Chinatown 次卧出租，通勤方便，适合单人。', '合租', 'Chinatown, New York, NY', '次卧', 'rent', 1250, 1250, current_date + 5, '半年起租', false, true, '近 B/D/F/M/J/Z 多条地铁', 15, 84),
  ('housing_long_island_house', 'Long Island 三房一厅整租 带车位和后院', $$Long Island 住宅区三房一厅整租，带车道停车位和小后院，适合家庭居住。周边安静，开车到超市、学校和火车站都方便。房屋维护良好，厨房和客厅空间宽敞。租客需自行负责电、煤气和网络。$$, 'Long Island 三房整租，适合家庭，带停车位。', 'House 整租', 'Long Island, NY', '三房一厅', 'rent', 3200, 3200, current_date + 20, '一年起租', true, false, '开车约 8 分钟到 LIRR 车站', 30, 77),
  ('housing_los_angeles_room', '洛杉矶 Koreatown 单间出租 包水电网', $$Los Angeles Koreatown 单间出租，公寓位置方便，近超市、餐馆和公交。房间有床和书桌，可拎包入住。租金包含水电网，适合学生或刚到洛杉矶工作的朋友。希望租客安静、爱干净，不吸烟。$$, 'Koreatown 单间，包水电网，可拎包入住。', '单间出租', 'Koreatown, Los Angeles, CA', '单间', 'rent', 1050, 1050, current_date + 10, '短租三个月起，长租优先', false, true, '近 Wilshire/Normandie 地铁站', 1, 142),
  ('housing_san_gabriel_apartment', 'San Gabriel 两房两卫公寓整租', $$San Gabriel 两房两卫公寓整租，社区安静，带一个停车位，附近有华人超市、餐馆和学校。房间布局方正，主卧带独卫，适合小家庭或两位室友合租。需查收入和信用，入住时间可协调。$$, 'San Gabriel 两房两卫公寓，带停车位。', 'Apartment 整租', 'San Gabriel, CA', '两房两卫', 'rent', 2750, 2750, current_date + 12, '一年租约', false, false, '近 Valley Blvd 生活圈', 3, 111),
  ('housing_irvine_townhome', 'Irvine Townhome 次卧出租 近 UCI', $$Irvine 安静 Townhome 次卧出租，开车到 UCI、Spectrum 和超市都方便。社区安全，带洗衣机烘干机，可使用厨房。适合学生、实习生或正职人士。希望租客作息规律，不开派对，不养宠物。$$, 'Irvine 次卧出租，近 UCI 和购物区。', '合租', 'Irvine, CA', '次卧', 'rent', 1280, 1280, current_date + 7, '6 个月起租', false, true, '开车约 10 分钟到 UCI', 7, 93),
  ('housing_san_francisco_inlaw', 'San Francisco Sunset 独立出入一房一厅', $$San Francisco Sunset 区一房一厅出租，独立出入，适合单人或情侣。附近有 Muni、华人超市和餐馆，通勤到市区方便。室内有简单家具，可做饭。房东住楼上，希望租客安静、保持整洁。$$, 'Sunset 独立出入一房一厅，适合单人或情侣。', '套房出租', 'Sunset, San Francisco, CA', '一房一厅', 'rent', 2350, 2350, current_date + 15, '一年优先', false, false, '近 Muni N 线和 29 路公交', 15, 118),
  ('housing_seattle_room', 'Seattle Bellevue 单间出租 近微软通勤线', $$Bellevue 安静社区单间出租，适合在 Eastside 上班的正职人士。房间明亮，公共区域宽敞，有车位。开车到 Microsoft、Amazon Bellevue 和华人超市都方便。希望租客无烟、少炊、爱干净。$$, 'Bellevue 单间，适合 Eastside 上班族。', '单间出租', 'Bellevue, WA', '单间', 'rent', 1150, 1150, current_date + 5, '半年起租', false, true, '近 Microsoft 通勤路线和 520', 30, 69),
  ('housing_houston_house', 'Houston Sugar Land 四房独栋整租', $$Sugar Land 安静社区四房独栋整租，带车库和后院，适合家庭居住。附近有学校、超市、公园和中餐馆，开车生活便利。房子保养良好，厨房空间大。租客需收入稳定，长期租约优先。$$, 'Sugar Land 四房独栋，带车库后院，适合家庭。', 'House 整租', 'Sugar Land, Houston, TX', '四房两卫', 'rent', 2850, 2850, current_date + 21, '一年起租', true, false, '近 Highway 6 和华人超市', 7, 102),
  ('housing_jersey_city_apartment', 'Jersey City 一房一厅出租 近 PATH', $$Jersey City 一房一厅公寓出租，步行可到 PATH，通勤曼哈顿方便。楼内有电梯和洗衣房，附近餐馆、超市齐全。适合在纽约上班但希望居住空间更宽敞的租客。水暖包含，电网自付。$$, 'Jersey City 一房一厅，近 PATH，通勤曼哈顿方便。', 'Apartment', 'Jersey City, NJ', '一房一厅', 'rent', 2450, 2450, current_date + 10, '一年租约', false, false, '步行约 7 分钟到 Journal Square PATH', 3, 132),
  ('housing_boston_room', 'Boston Quincy 单间出租 近红线', $$Quincy 单间出租，适合在 Boston 上学或工作的朋友。步行可到红线地铁和华人超市，房间有基本家具。室友安静，厨房可做饭。希望租客保持公共区域整洁，长租优先。$$, 'Quincy 单间，近红线和超市，通勤方便。', '单间出租', 'Quincy, MA', '单间', 'rent', 980, 980, current_date + 7, '6 个月起租', false, true, '近 Red Line Quincy Center', 15, 74),
  ('housing_chicago_apartment', 'Chicago Chinatown 两房一厅出租', $$Chicago Chinatown 附近两房一厅出租，生活便利，适合小家庭或室友合租。附近有红线、超市、餐馆和公园。房间采光好，楼内安静。租客需收入稳定，不吸烟，入住前可安排看房。$$, 'Chicago Chinatown 两房一厅，生活便利。', 'Apartment', 'Chinatown, Chicago, IL', '两房一厅', 'rent', 1950, 1950, current_date + 14, '一年租约', false, false, '近 Cermak-Chinatown 红线站', 30, 88),
  ('housing_atlanta_master', 'Atlanta Duluth 主卧出租 近华人商圈', $$Duluth 主卧出租，房间宽敞，带独立衣帽间，适合正职人士。附近有 H Mart、餐馆和购物中心，开车生活方便。家中氛围安静，公共区域保持整洁。可使用厨房和洗衣机，长租优先。$$, 'Duluth 主卧出租，近华人商圈，停车方便。', '套房出租', 'Duluth, Atlanta, GA', '主卧', 'rent', 1050, 1050, current_date + 9, '半年起租', false, true, '开车约 5 分钟到 Pleasant Hill 商圈', 1, 57);

  create temp table tmp_demo_housing_posts on commit drop as
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
      'housing'::public.post_type,
      title,
      summary,
      body,
      'housing',
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
        'demo_category', 'housing',
        'demo_key', demo_key,
        'source', 'openaa_official_original',
        'city_display', address_area
      )
    from tmp_demo_housing
    returning id, title, metadata
  )
  select i.id as post_id, h.*
  from inserted i
  join tmp_demo_housing h on i.metadata ->> 'demo_key' = h.demo_key;

  insert into public.post_details_housing (
    post_id,
    address_area,
    available_date,
    deposit_amount,
    housing_type,
    lease_term,
    listing_type,
    pets_allowed,
    rent_amount,
    transit_nearby,
    utilities_included
  )
  select
    post_id,
    address_area,
    available_date,
    deposit_amount,
    housing_type,
    lease_term,
    listing_type,
    pets_allowed,
    rent_amount,
    transit_nearby,
    utilities_included
  from tmp_demo_housing_posts;

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
  from tmp_demo_housing_posts;

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
  from tmp_demo_housing_posts
  cross join lateral generate_series(1, view_count) as gs;

  perform public.refresh_post_stats(post_id)
  from tmp_demo_housing_posts;
end $migration$;
