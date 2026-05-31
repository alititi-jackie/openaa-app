import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CarFront,
  Home,
  Map,
  Newspaper,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";

export const publicChannelRoutes = [
  { href: "/jobs", label: "招聘", description: "纽约招聘与求职信息" },
  { href: "/housing", label: "房屋", description: "租房、求租和房屋信息" },
  { href: "/marketplace", label: "二手", description: "二手市场与闲置交易" },
  { href: "/services", label: "服务", description: "本地商家和生活服务" },
  { href: "/news", label: "新闻", description: "纽约华人新闻与生活资讯" },
  { href: "/dmv", label: "DMV", description: "纽约 DMV 中文练习与导航" },
  { href: "/navigation", label: "导航", description: "常用网站与生活入口" },
  { href: "/feedback", label: "反馈", description: "意见反馈与问题提交" },
];

export const bottomNavItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/jobs", label: "招聘", icon: BriefcaseBusiness },
  { href: "/housing", label: "房屋", icon: Building2 },
  { href: "/news", label: "新闻", icon: Newspaper },
  { href: "/profile", label: "我的", icon: UserRound },
];

export const homeQuickLinks = [
  { href: "/jobs", label: "招聘", icon: BriefcaseBusiness },
  { href: "/housing", label: "房屋", icon: Building2 },
  { href: "/marketplace", label: "二手", icon: ShoppingBag },
  { href: "/services", label: "服务", icon: Store },
  { href: "/news", label: "新闻", icon: Newspaper },
  { href: "/dmv", label: "DMV", icon: CarFront },
  { href: "/navigation", label: "导航", icon: Map },
  { href: "/profile/notifications", label: "通知", icon: Bell },
];
