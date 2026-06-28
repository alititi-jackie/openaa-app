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
  title: "OpenAA 美国华人生活信息与本地服务入口",
  content:
    `OpenAA 是面向美国华人的中文生活信息入口，重点服务纽约及周边华人社区，也适合刚来美国的新移民、留学生、访问学者、上班族、家庭用户和本地商家使用。网站把日常高频需求集中在一个手机友好的页面里，包括华人招聘、纽约租房、房屋求租、二手交易、本地服务、新闻资讯、DMV 中文练习、罚单查询和常用网站导航。用户可以先从首页选择频道，再按照地区、分类、发布时间和详情内容继续筛选，减少在群聊、搜索结果和不同英文网站之间反复切换的时间。

在招聘频道，OpenAA 支持餐馆、办公室、仓库、司机、美甲、美容、会计、IT、设计、兼职和全职等岗位信息浏览与发布；房屋频道覆盖单间、整租、合租、短租、长租、房屋出租和求租需求；二手市场适合发布手机、电脑、家具、电器、自行车、汽车用品和生活闲置；本地服务则整理搬家、装修、维修、清洁、家政、接送、快递、翻译、摄影、保险、贷款、报税、律师、医疗和美容等资源。新闻与指南内容会围绕美国华人生活、纽约本地动态、移民与办事提醒、DMV 流程、驾照考试和实用生活教程持续更新。

OpenAA 的目标不是简单堆放链接，而是用清晰的中文分类、可读的移动端页面和稳定的内容结构，帮助用户更快找到可靠线索。常用导航会收录政府服务、银行金融、交通出行、学校教育、医疗机构、购物网站、快递物流和生活工具入口，方便收藏和再次打开。涉及政府申请、缴费、考试预约、法律、税务、保险或线下交易时，请以官方机构、专业人士和实际沟通结果为准；OpenAA 提供中文整理、信息连接和生活入口，帮助在美华人更高效地寻找美国生活所需信息。`,
  isVisible: true,
};

export const fallbackTopQuickLinks = getFallbackTopQuickLinks(DEFAULT_HOME_CITY_SLUG);
