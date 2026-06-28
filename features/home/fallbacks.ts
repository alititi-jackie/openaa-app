import { BookOpenCheck, BriefcaseBusiness, Building2, CarFront, Map, Newspaper, ShoppingBag, Store } from "lucide-react";
import { getFallbackTopQuickLinks } from "@/features/navigation/topQuickLinks";
import { DEFAULT_NEWS_CATEGORIES } from "@/features/news/constants";
import { DEFAULT_HOME_CITY_NAME, DEFAULT_HOME_CITY_SLUG } from "./constants";
import type { HomeBannerItem } from "@/components/home/HomeBanner";
import type { QuickGridItem } from "@/components/home/QuickGrid";
import type { UtilityCardItem } from "@/components/home/UtilityCards";
import type { HomeCity, HomeLatestNewsCategoryConfig, HomeLatestPostSectionConfig, HomeSeoContent, HomeTickerItem, HomeTickerSettings } from "./types";

export const fallbackHomeCity: HomeCity = {
  id: null,
  slug: DEFAULT_HOME_CITY_SLUG,
  name: DEFAULT_HOME_CITY_NAME,
};

export const fallbackHomeBanners: HomeBannerItem[] = [
  {
    title: "纽约华人生活信息入口",
    description: "招聘、租房、二手、本地服务、DMV 学习和常用导航，先从一个清爽的移动端首页开始。",
    href: "/navigation",
    imageUrl: "",
  },
];

export const fallbackTickerItems: HomeTickerItem[] = [
  { label: "OpenAA 纽约站已上线，欢迎发布招聘、房屋、二手和本地服务信息", href: "/news" },
];

export const fallbackTickerSettings: HomeTickerSettings = {
  global: {
    isEnabled: true,
    intervalSeconds: 4,
  },
  sections: [
    { sectionKey: "news", sectionName: "新闻", isEnabled: true, sortOrder: 10, displayCount: 5 },
    { sectionKey: "jobs", sectionName: "招聘", isEnabled: true, sortOrder: 20, displayCount: 3 },
    { sectionKey: "housing", sectionName: "房屋", isEnabled: true, sortOrder: 30, displayCount: 3 },
    { sectionKey: "marketplace", sectionName: "二手", isEnabled: true, sortOrder: 40, displayCount: 3 },
    { sectionKey: "services", sectionName: "本地服务", isEnabled: true, sortOrder: 50, displayCount: 3 },
  ],
};

export const fallbackQuickGridItems: QuickGridItem[] = [
  { href: "/jobs", label: "招聘", icon: BriefcaseBusiness },
  { href: "/housing", label: "房屋", icon: Building2 },
  { href: "/marketplace", label: "二手", icon: ShoppingBag },
  { href: "/dmv", label: "DMV", icon: CarFront },
  { href: "/news", label: "新闻", icon: Newspaper },
  { href: "/navigation", label: "导航", icon: Map },
  { href: "/news", label: "新手指南", icon: BookOpenCheck },
  { href: "/services", label: "本地服务", icon: Store },
];

export const fallbackUtilityTools: UtilityCardItem[] = [
  { title: "DMV 笔试练习", description: "中文题库、练习模式、模拟考试入口。", href: "/dmv", icon: "dmv", theme: "blue", cta: "练习" },
  { title: "罚单查询", description: "停车、闯红灯、超速拍照查询入口。", href: "/dmv/tickets", icon: "ticket", theme: "orange", cta: "查询" },
  { title: "常用导航", description: "政府服务、交通、生活网站入口。", href: "/navigation", icon: "navigation", theme: "cyan", cta: "打开" },
  { title: "新手指南", description: "纽约生活、证件、交通和常用信息。", href: "/news", icon: "guide", theme: "amber", cta: "查看" },
];

export const fallbackLatestPostSections: HomeLatestPostSectionConfig[] = [
  {
    key: "jobs",
    title: "最新招聘",
    navLabel: "招聘",
    postType: "job",
    route: "/jobs",
    isVisible: true,
    sortOrder: 10,
    limitCount: 6,
    layout: "grid",
    description: "纽约华人招聘、求职、兼职和全职信息。",
    emptyMessage: "暂无最新信息",
  },
  {
    key: "housing",
    title: "最新房屋",
    navLabel: "房屋",
    postType: "housing",
    route: "/housing",
    isVisible: true,
    sortOrder: 20,
    limitCount: 6,
    layout: "grid",
    description: "租房、求租、合租和房屋信息。",
    emptyMessage: "暂无最新信息",
  },
  {
    key: "marketplace",
    title: "最新二手",
    navLabel: "二手",
    postType: "marketplace",
    route: "/marketplace",
    isVisible: true,
    sortOrder: 30,
    limitCount: 6,
    layout: "grid",
    description: "出售、求购和跳蚤市场信息。",
    emptyMessage: "暂无最新信息",
  },
  {
    key: "services",
    title: "本地服务",
    navLabel: "服务",
    postType: "service",
    route: "/services",
    isVisible: true,
    sortOrder: 40,
    limitCount: 6,
    layout: "media",
    description: "搬家、维修、装修、报税等服务。",
    emptyMessage: "暂无最新信息",
  },
  {
    key: "news",
    title: "最新新闻",
    navLabel: "新闻",
    postType: "news",
    route: "/news",
    isVisible: true,
    sortOrder: 50,
    limitCount: 15,
    layout: "news",
    description: "本地新闻、新手指南、DMV 教程和平台公告。",
    emptyMessage: "暂无最新信息",
  },
];

export const fallbackLatestNewsCategories: HomeLatestNewsCategoryConfig[] = DEFAULT_NEWS_CATEGORIES.map((category) => ({
  key: category.slug,
  title: category.name,
  categorySlug: category.slug,
  isVisible: true,
  sortOrder: category.sort_order,
  limitCount: 3,
}));

export const fallbackSeoContent: HomeSeoContent = {
  title: "OpenAA 纽约华人生活入口",
  content:
    "OpenAA 是专为美国华人打造的本地生活信息平台，致力于为在美国生活、工作、学习和创业的华人提供真实、便捷、免费的生活信息服务。平台涵盖纽约华人生活、美国华人招聘、房屋租售、二手交易、本地服务、新闻资讯、DMV 学习及生活导航等多个板块，希望帮助更多华人快速找到所需信息，让在美生活更加简单高效。

无论您是刚来到美国的新移民、留学生、访问学者，还是已经长期生活在美国的华人居民，都可以通过 OpenAA 快速浏览或发布各类本地信息。平台支持招聘求职、房屋出租、房屋求租、二手买卖、商家推广、搬家运输、家政保洁、装修维修、法律咨询、教育培训、旅游出行等生活服务信息，为华人社区建立更加方便的信息交流平台。

招聘频道提供纽约招聘、全美招聘、兼职、全职、餐馆招聘、办公室招聘、仓库招聘、司机招聘、美甲、美容、按摩、会计、IT、设计等各类工作机会，也欢迎企业和商家免费发布招聘信息，帮助更多华人找到适合自己的工作。

房屋频道覆盖纽约租房、公寓出租、单间出租、整套出租、短租、长租、房屋出售、求租等信息，并持续扩展至加州、德州、佛州、新泽西、波士顿、芝加哥、西雅图、洛杉矶、旧金山等美国主要城市，为华人提供更全面的租房和买房信息参考。

二手市场支持手机、电脑、家具、电器、自行车、汽车用品、婴儿用品、学习用品等二手商品发布与浏览，也支持免费求购信息发布，让闲置物品能够快速找到新的主人，帮助华人节省生活成本。

生活服务频道汇集搬家、装修、维修、水电、清洁、家政、月嫂、保姆、接送、快递、翻译、摄影、保险、贷款、报税、律师、医疗、美容、宠物等丰富服务资源，方便华人在本地快速寻找可靠服务。

新闻资讯频道持续整理与美国华人生活相关的重要资讯，包括移民政策、签证信息、DMV 办理流程、驾照考试、交通法规、社区新闻、生活提醒、政府公告及实用指南，让用户能够第一时间获取有价值的信息。

OpenAA 同时建设了丰富的华人生活导航，收录政府机构、银行金融、快递物流、购物网站、学校教育、医疗机构、交通出行、手机运营商、生活工具等常用网站入口，帮助用户快速找到常用资源，提高办事效率。

未来 OpenAA 将持续完善内容审核机制，不断提升信息真实性和用户体验，打造更加安全、可靠、实用的美国华人分类信息平台。我们希望无论是寻找工作、租房、买卖二手、发布服务、了解新闻，还是查询生活信息，都能让更多华人在 OpenAA 一站式完成，真正成为值得信赖的美国华人生活入口。",
  isVisible: true,
};

export const fallbackTopQuickLinks = getFallbackTopQuickLinks(DEFAULT_HOME_CITY_SLUG);
