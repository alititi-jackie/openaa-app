import { BookOpenCheck, BriefcaseBusiness, Building2, CarFront, Map, Newspaper, ShoppingBag, Store } from "lucide-react";
import { getFallbackTopQuickLinks } from "@/features/navigation/topQuickLinks";
import { DEFAULT_HOME_CITY_NAME, DEFAULT_HOME_CITY_SLUG } from "./constants";
import type { HomeBannerItem } from "@/components/home/HomeBanner";
import type { QuickGridItem } from "@/components/home/QuickGrid";
import type { UtilityCardItem } from "@/components/home/UtilityCards";
import type { HomeCity, HomeLatestPostSectionConfig, HomeSeoContent, HomeTickerItem, HomeTickerSettings } from "./types";

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
    imageUrl: "/og-default.png",
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
    { sectionKey: "marketplace", sectionName: "二手 / 市场", isEnabled: true, sortOrder: 40, displayCount: 3 },
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

export const fallbackSeoContent: HomeSeoContent = {
  title: "OpenAA 纽约华人生活入口",
  content:
    "OpenAA 面向纽约华人社区，整理招聘、租房、二手市场、本地服务、新闻资讯、DMV 学习和常用导航等入口。第一版先建立移动优先的前台结构，后续再逐步接入真实内容和审核流程。",
  isVisible: true,
};

export const fallbackTopQuickLinks = getFallbackTopQuickLinks(DEFAULT_HOME_CITY_SLUG);
