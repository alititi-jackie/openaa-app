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
  where post_type = 'service'
    and metadata ->> 'demo_batch' = v_batch;

  create temp table tmp_demo_services (
    demo_key text primary key,
    title text not null,
    body text not null,
    summary text not null,
    subcategory text,
    service_category text,
    service_area text,
    price_range text,
    business_hours jsonb,
    service_status text,
    age_days integer,
    view_count integer
  ) on commit drop;

  insert into tmp_demo_services values
  ('services_flushing_moving', '纽约华人搬家 小件大件都可预约', $$提供纽约市内和近郊搬家服务，可做公寓搬家、学生搬家、办公室小型搬迁和家具单件搬运。师傅熟悉电梯楼、楼梯楼和常见公寓管理要求，报价按距离、楼层和物品数量计算。提前预约可安排周末或晚间时间。$$, '纽约市内搬家、家具搬运，可预约周末。', '搬家运输', '搬家运输', 'New York City / Queens / Brooklyn', '小件 $80 起，整屋搬家面议', '{"weekdays":"9:00 AM - 7:00 PM","weekends":"10:00 AM - 6:00 PM"}'::jsonb, 'active', 1, 146),
  ('services_queens_cleaning', 'Queens 退租清洁和深度清洁服务', $$承接 Queens、Brooklyn、Manhattan 公寓退租清洁、入住前清洁和定期家庭清洁。可清厨房油污、浴室水垢、地板、窗台和柜子表面。自带常用清洁工具，特殊清洁剂可提前说明。适合搬家前后和短租房整理。$$, '退租清洁、入住前清洁、定期家庭清洁。', '家政清洁', '家政清洁', 'Queens / Brooklyn / Manhattan', '$120 起，按面积和状况报价', '{"weekdays":"8:30 AM - 6:30 PM","weekends":"9:00 AM - 5:00 PM"}'::jsonb, 'active', 3, 132),
  ('services_brooklyn_renovation', 'Brooklyn 室内装修 地板油漆橱柜安装', $$提供公寓和店铺小型装修服务，包括油漆、地板、瓷砖、橱柜安装、隔断和局部翻新。可先上门看现场，再根据材料和工期报价。团队熟悉纽约老房常见问题，适合出租房翻新、店铺开业前整理和家庭局部改造。$$, '油漆、地板、瓷砖、橱柜安装和局部翻新。', '装修维修', '装修维修', 'Brooklyn / Queens / Manhattan', '上门估价，材料人工分开报价', '{"weekdays":"8:00 AM - 6:00 PM","weekends":"By appointment"}'::jsonb, 'active', 7, 118),
  ('services_manhattan_plumbing', '曼哈顿水电维修 漏水堵塞灯具安装', $$承接曼哈顿及周边公寓水电小修，包括水龙头漏水、马桶堵塞、下水慢、开关插座更换、灯具安装和简单排查。可根据情况安排当天或次日上门。复杂工程会先说明风险和费用，不乱开价。$$, '水电小修、漏水堵塞、灯具安装，可预约上门。', '装修维修', '装修维修', 'Manhattan / Long Island City / Brooklyn', '$95 起，上门后确认报价', '{"weekdays":"9:00 AM - 8:00 PM","weekends":"10:00 AM - 4:00 PM"}'::jsonb, 'active', 15, 97),
  ('services_la_ac_repair', '洛杉矶空调维修 清洗加氟和故障排查', $$提供 Los Angeles、San Gabriel、Alhambra、Arcadia 周边空调维修和保养服务，包括不制冷、漏水、噪音、滤网清洗、加氟检查和温控器问题。夏季建议提前预约，简单故障可先电话描述情况。$$, '空调维修保养，不制冷、漏水、清洗可预约。', '装修维修', '装修维修', 'Los Angeles / San Gabriel Valley', '$120 起，配件另计', '{"weekdays":"8:00 AM - 7:00 PM","weekends":"9:00 AM - 5:00 PM"}'::jsonb, 'active', 1, 141),
  ('services_san_gabriel_tax', 'San Gabriel 个人和小商家报税服务', $$提供个人报税、自雇收入、1099、W-2、多州收入和小商家基础账务整理。可线上发送资料，也可预约面对面咨询。会根据客户情况提醒常见扣除项目和需要保留的文件，适合第一次报税或资料较多的家庭。$$, '个人报税、自雇和小商家基础账务整理。', '财税保险', '财税保险', 'San Gabriel / Alhambra / Online', '个人报税 $120 起，小商家面议', '{"weekdays":"10:00 AM - 6:00 PM","weekends":"By appointment"}'::jsonb, 'active', 3, 128),
  ('services_irvine_accounting', 'Irvine 小公司记账和 Payroll 协助', $$为南加小公司、网店和自由职业者提供月度记账、收支分类、发票整理、Payroll 协助和销售税资料准备。服务可远程进行，适合希望把账目整理清楚、月底有固定报表的小商家。首次沟通会先了解业务规模。$$, '小公司月度记账、Payroll 协助和报表整理。', '财税保险', '财税保险', 'Irvine / Orange County / Remote', '月费 $250 起，按业务量报价', '{"weekdays":"9:30 AM - 5:30 PM"}'::jsonb, 'active', 7, 103),
  ('services_sf_immigration_law', '湾区移民律师咨询 H-1B 绿卡家庭移民', $$提供移民法律咨询预约，包括 H-1B、NIW、PERM、婚姻绿卡、亲属移民和身份转换等方向。首次咨询会梳理时间线、材料重点和可行路径。服务覆盖湾区，也可安排视频咨询。正式案件需签署委托协议。$$, '移民法律咨询，H-1B、绿卡、家庭移民等。', '法律移民', '法律移民', 'San Francisco Bay Area / Online', '咨询按小时收费，案件另行报价', '{"weekdays":"9:00 AM - 6:00 PM","weekends":"By appointment"}'::jsonb, 'active', 15, 116),
  ('services_seattle_translation', 'Seattle 中英文件翻译 公证预约协助', $$提供中英文文件翻译和资料整理，包括出生证明、成绩单、简历、合同摘要、移民辅助材料等。可根据用途说明是否需要认证翻译格式。Seattle 地区可约当面交接，也可线上处理扫描件。$$, '中英文文件翻译，移民、学校和商务资料均可。', '翻译文书', '翻译文书', 'Seattle / Bellevue / Online', '$35 起，按字数和用途报价', '{"weekdays":"10:00 AM - 7:00 PM","weekends":"12:00 PM - 5:00 PM"}'::jsonb, 'active', 30, 72),
  ('services_houston_airport', 'Houston 机场接送和商务用车预约', $$提供 IAH、Hobby 机场接送、商务接待和短途包车。司机熟悉 Houston、Sugar Land、Katy 和 Chinatown 周边路线，车辆干净，适合家庭出行、客户接待和行李较多的旅客。请提前提供航班和人数。$$, 'Houston 机场接送、商务用车和短途包车。', '接送包车', '接送包车', 'Houston / Sugar Land / Katy', '机场接送 $65 起', '{"weekdays":"6:00 AM - 11:00 PM","weekends":"6:00 AM - 11:00 PM"}'::jsonb, 'active', 3, 137),
  ('services_jersey_city_photo', 'Jersey City 证件照和家庭摄影', $$提供证件照、职业头像、家庭纪念照和小型活动摄影。可在 Jersey City 工作室拍摄，也可预约户外或上门。照片会做基础调色和修整，适合 LinkedIn、毕业申请、家庭节日照和宝宝成长记录。$$, '证件照、职业头像、家庭摄影，可预约上门。', '摄影摄像', '摄影摄像', 'Jersey City / Manhattan / Brooklyn', '证件照 $45 起，套系面议', '{"weekdays":"11:00 AM - 7:00 PM","weekends":"10:00 AM - 6:00 PM"}'::jsonb, 'active', 7, 88),
  ('services_boston_tutoring', 'Boston 数学英文家教 小初高课业辅导', $$提供小初高中数学、英文阅读写作和作业辅导，可线上或 Boston、Quincy 周边线下。课程会根据学生学校进度安排，重点帮助补基础、整理错题和建立学习习惯。适合需要稳定陪伴式辅导的家庭。$$, '数学英文家教，线上线下均可，按学生进度安排。', '教育培训', '教育培训', 'Boston / Quincy / Online', '$45/小时起', '{"weekdays":"4:00 PM - 9:00 PM","weekends":"10:00 AM - 6:00 PM"}'::jsonb, 'active', 1, 119),
  ('services_chicago_beauty', 'Chicago 上门美容美睫 需提前预约', $$提供上门美容、美睫和基础皮肤护理预约，适合不方便出门或希望在家放松的客户。使用一次性耗材和常规消毒流程，服务前会确认皮肤状态和需求。Chicago Chinatown、South Loop、Bridgeport 周边可预约。$$, '上门美容美睫和基础护理，需提前预约。', '美容护理', '美容护理', 'Chicago Chinatown / South Loop', '$80 起，按项目报价', '{"weekdays":"11:00 AM - 8:00 PM","weekends":"10:00 AM - 7:00 PM"}'::jsonb, 'active', 15, 83),
  ('services_atlanta_auto', 'Atlanta 华人汽车保养 换油刹车轮胎检查', $$提供基础汽车保养预约，包括换机油、刹车片检查、轮胎补气和简单故障初步判断。Duluth、Norcross、Johns Creek 周边可预约。复杂维修会建议到店检查，不承诺远程判断所有故障。$$, '基础汽车保养、换油、刹车和轮胎检查。', '汽车相关', '汽车相关', 'Duluth / Norcross / Johns Creek', '换油 $65 起，配件另计', '{"weekdays":"9:00 AM - 6:00 PM","saturday":"9:00 AM - 3:00 PM"}'::jsonb, 'active', 30, 65),
  ('services_remote_it', '远程电脑手机设置 邮箱打印机和软件协助', $$提供远程电脑和手机基础设置协助，包括邮箱登录、打印机连接、软件安装、资料备份、视频会议设置和常见网络问题排查。适合长辈、留学生和小商家。能远程解决的按小时计费，需要上门的再另约时间。$$, '远程协助电脑手机设置、打印机、邮箱和软件问题。', '电脑手机', '电脑手机', 'United States / Remote', '$35/半小时起', '{"weekdays":"10:00 AM - 9:00 PM","weekends":"12:00 PM - 6:00 PM"}'::jsonb, 'active', 1, 154);

  create temp table tmp_demo_service_posts on commit drop as
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
      'service'::public.post_type,
      title,
      summary,
      body,
      'services',
      subcategory,
      'published'::public.post_status,
      'public'::public.post_visibility,
      now() - make_interval(days => age_days),
      now() - make_interval(days => age_days),
      now() - make_interval(days => age_days),
      now() + interval '120 days',
      jsonb_build_object(
        'official_demo', true,
        'demo_batch', v_batch,
        'demo_category', 'services',
        'demo_key', demo_key,
        'source', 'openaa_official_original',
        'city_display', service_area
      )
    from tmp_demo_services
    returning id, title, metadata
  )
  select i.id as post_id, s.*
  from inserted i
  join tmp_demo_services s on i.metadata ->> 'demo_key' = s.demo_key;

  insert into public.post_details_services (
    post_id,
    business_hours,
    price_range,
    service_area,
    service_category,
    service_status
  )
  select
    post_id,
    business_hours,
    price_range,
    service_area,
    service_category,
    service_status
  from tmp_demo_service_posts;

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
  from tmp_demo_service_posts;

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
  from tmp_demo_service_posts
  cross join lateral generate_series(1, view_count) as gs;

  perform public.refresh_post_stats(post_id)
  from tmp_demo_service_posts;
end $migration$;
