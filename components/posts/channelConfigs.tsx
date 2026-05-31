import { BriefcaseBusiness, Building2, ShoppingBag, Store } from "lucide-react";
import type { ChannelPageConfig } from "./ChannelPageShell";

export const channelConfigs: Record<"jobs" | "housing" | "marketplace" | "services", ChannelPageConfig> = {
  jobs: {
    title: "纽约华人招聘",
    description: "招聘、求职、兼职、全职等信息入口。第一版先展示频道结构，不接真实招聘数据。",
    path: "/jobs",
    icon: BriefcaseBusiness,
    tabs: ["全部", "全职", "兼职", "餐馆", "办公室", "求职"],
    searchPlaceholder: "搜索职位、公司或区域",
    posts: [
      { title: "餐馆前台招聘占位", description: "后续接入真实发布后显示薪资、区域和联系方式。", href: "/jobs", meta: "占位", tag: "招聘" },
      { title: "办公室助理求职占位", description: "这里展示求职类信息卡片样式。", href: "/jobs", meta: "占位", tag: "求职" },
    ],
    seoTitle: "纽约华人招聘与求职",
    seoContent: "OpenAA 招聘频道面向纽约华人社区，后续会承载本地招聘、兼职、全职、求职和工作经验相关内容。",
  },
  housing: {
    title: "纽约租房与房屋信息",
    description: "租房、求租、合租、转租和房屋信息入口。当前使用静态壳，后续再接 Supabase。",
    path: "/housing",
    icon: Building2,
    tabs: ["全部", "出租", "求租", "合租", "转租", "房屋"],
    searchPlaceholder: "搜索区域、房型或预算",
    posts: [
      { title: "法拉盛单房出租占位", description: "后续显示价格、入住时间和交通信息。", href: "/housing", meta: "占位", tag: "出租" },
      { title: "曼哈顿求租占位", description: "这里展示求租信息卡片样式。", href: "/housing", meta: "占位", tag: "求租" },
    ],
    seoTitle: "纽约华人租房信息",
    seoContent: "OpenAA 房屋频道为纽约华人用户整理租房、求租、合租和转租等居住信息，第一版先建立移动端浏览结构。",
  },
  marketplace: {
    title: "二手市场",
    description: "出售、求购、闲置转让和跳蚤市场入口。新项目统一使用 /marketplace。",
    path: "/marketplace",
    icon: ShoppingBag,
    tabs: ["全部", "出售", "求购", "家具", "电器", "搬家"],
    searchPlaceholder: "搜索二手物品或区域",
    posts: [
      { title: "搬家家具出售占位", description: "后续显示价格、区域和取货方式。", href: "/marketplace", meta: "占位", tag: "出售" },
      { title: "求购显示器占位", description: "这里展示求购信息卡片样式。", href: "/marketplace", meta: "占位", tag: "求购" },
    ],
    seoTitle: "纽约华人二手市场",
    seoContent: "OpenAA 二手市场频道用于承载出售、求购、搬家处理和本地自取等信息，后续会接入真实发布与审核流程。",
  },
  services: {
    title: "纽约本地服务",
    description: "维修、搬家、装修、报税、清洁等本地服务入口。当前只提供公开页面壳。",
    path: "/services",
    icon: Store,
    tabs: ["全部", "搬家", "维修", "装修", "报税", "清洁"],
    searchPlaceholder: "搜索服务、商家或区域",
    posts: [
      { title: "搬家服务占位", description: "后续显示服务范围、联系方式和商家资料。", href: "/services", meta: "占位", tag: "搬家" },
      { title: "报税服务占位", description: "这里展示服务类信息卡片样式。", href: "/services", meta: "占位", tag: "报税" },
    ],
    seoTitle: "纽约华人本地服务",
    seoContent: "OpenAA 本地服务频道面向纽约华人日常生活场景，后续会逐步接入商家资料、服务分类和公开展示。",
  },
};
