import {
  ClipboardList,
  Database,
  LayoutGrid,
  Megaphone,
  MessageSquareText,
  Newspaper,
  ScrollText,
  Settings,
  Shield,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminModuleKey =
  | "user-posts"
  | "messages"
  | "news"
  | "navigation"
  | "home"
  | "ads"
  | "recycle-bin"
  | "users"
  | "settings"
  | "audit-logs"
  | "admin-access";

export type AdminModuleChild = {
  key: string;
  title: string;
  href?: string;
};

export type AdminModule = {
  key: AdminModuleKey;
  title: string;
  description: string;
  href: string;
  group: "content" | "users-security" | "operations";
  groupTitle: string;
  groupDescription: string;
  icon: LucideIcon;
  permissionKeys: string[];
  superAdminOnly?: boolean;
  children?: AdminModuleChild[];
};

export const ADMIN_MODULES: AdminModule[] = [
  {
    key: "user-posts",
    title: "用户发布信息管理",
    description: "统一管理用户发布的招聘、房屋、二手和本地服务信息，支持审核、下架、恢复显示、删除到回收站。",
    href: "/admin/user-posts",
    group: "content",
    groupTitle: "内容管理",
    groupDescription: "管理前台展示内容、用户发布内容和首页运营模块。",
    icon: ClipboardList,
    permissionKeys: [
      "view_posts",
      "view_post_contacts",
      "moderate_posts",
      "approve_posts",
      "reject_posts",
      "hide_posts",
      "restore_posts",
      "delete_posts",
    ],
    children: [
      { key: "jobs", title: "招聘" },
      { key: "housing", title: "房屋" },
      { key: "marketplace", title: "二手" },
      { key: "services", title: "本地服务" },
    ],
  },
  {
    key: "recycle-bin",
    title: "回收站",
    description: "统一管理发布信息、新闻和公共导航回收站，支持恢复和超级管理员永久删除。",
    href: "/admin/recycle-bin",
    group: "content",
    groupTitle: "内容管理",
    groupDescription: "管理前台展示内容、用户发布内容和首页运营模块。",
    icon: Trash2,
    permissionKeys: ["view_images", "delete_images", "manage_image_assets"],
    children: [
      { key: "post", title: "用户发布信息", href: "/admin/recycle-bin?tab=post" },
      { key: "news", title: "新闻", href: "/admin/recycle-bin?tab=news" },
      { key: "navigation", title: "公共导航", href: "/admin/recycle-bin?tab=navigation" },
      { key: "image-cleanup", title: "图片清理工具", href: "/admin/image-cleanup" },
    ],
  },
  {
    key: "news",
    title: "新闻管理",
    description: "管理新闻分类、草稿、发布、下架、置顶、封面和 SEO 字段。",
    href: "/admin/news",
    group: "content",
    groupTitle: "内容管理",
    groupDescription: "管理前台展示内容、用户发布内容和首页运营模块。",
    icon: Newspaper,
    permissionKeys: ["view_news", "create_news", "edit_news", "publish_news", "delete_news", "manage_news_categories"],
  },
  {
    key: "navigation",
    title: "导航管理",
    description: "管理公共导航分类、链接、推荐状态、启用状态和排序。",
    href: "/admin/navigation",
    group: "content",
    groupTitle: "内容管理",
    groupDescription: "管理前台展示内容、用户发布内容和首页运营模块。",
    icon: LayoutGrid,
    permissionKeys: ["manage_navigation", "manage_top_links"],
  },
  {
    key: "home",
    title: "首页配置管理",
    description: "管理首页模块、ticker、Banner 和 home sections。",
    href: "/admin/home",
    group: "content",
    groupTitle: "内容管理",
    groupDescription: "管理前台展示内容、用户发布内容和首页运营模块。",
    icon: Database,
    permissionKeys: ["manage_home_sections", "manage_latest_ticker"],
  },
  {
    key: "users",
    title: "用户管理",
    description: "查看用户资料状态，管理启用、受限、封禁等账号状态。",
    href: "/admin/users",
    group: "users-security",
    groupTitle: "用户与安全",
    groupDescription: "管理用户状态、反馈、举报和站内通知。",
    icon: Users,
    permissionKeys: [
      "view_users",
      "view_user_contacts",
      "edit_user_notes",
      "restrict_users",
      "ban_users",
      "restore_users",
      "manage_user_status",
      "view_user_posts",
    ],
  },
  {
    key: "admin-access",
    title: "管理员授权",
    description: "搜索真实用户后授予后台角色，管理管理员角色、功能授权、限制豁免、停用和恢复。",
    href: "/admin/admins",
    group: "users-security",
    groupTitle: "用户与安全",
    groupDescription: "管理用户状态、反馈、举报和站内通知。",
    icon: Shield,
    permissionKeys: ["view_admins", "add_admins", "edit_admin_roles", "edit_admin_permissions", "disable_admins", "restore_admins", "manage_admins"],
    superAdminOnly: true,
  },
  {
    key: "messages",
    title: "消息中心",
    description: "集中处理用户反馈、内容举报和站内通知。",
    href: "/admin/messages",
    group: "users-security",
    groupTitle: "用户与安全",
    groupDescription: "管理用户状态、反馈、举报和站内通知。",
    icon: MessageSquareText,
    permissionKeys: [
      "view_feedback",
      "handle_feedback",
      "view_reports",
      "handle_reports",
      "view_post_reports",
      "handle_post_reports",
      "manage_system_announcements",
      "manage_notifications",
      "super_admin",
    ],
    children: [
      { key: "feedback", title: "反馈", href: "/admin/messages?tab=feedback" },
      { key: "reports", title: "举报", href: "/admin/messages?tab=reports" },
      { key: "notifications", title: "通知", href: "/admin/messages?tab=notifications" },
    ],
  },
  {
    key: "ads",
    title: "广告管理",
    description: "管理首页和频道页广告位、图片外链、跳转链接、起止时间和启用状态。",
    href: "/admin/ads",
    group: "operations",
    groupTitle: "运营设置",
    groupDescription: "管理广告、站点规则、图片维护和审计记录。",
    icon: Megaphone,
    permissionKeys: ["manage_ads"],
  },
  {
    key: "settings",
    title: "站点设置",
    description: "管理每日发帖上限等基础站点规则，使用新站 admin_roles 权限和审计日志。",
    href: "/admin/settings",
    group: "operations",
    groupTitle: "运营设置",
    groupDescription: "管理广告、站点规则、图片维护和审计记录。",
    icon: Settings,
    permissionKeys: ["view_settings", "manage_settings", "manage_rate_limits", "manage_sensitive_words", "view_search_logs"],
  },
  {
    key: "audit-logs",
    title: "审计日志",
    description: "查看后台操作记录和关键实体变更，方便上线后追溯。",
    href: "/admin/audit-logs",
    group: "operations",
    groupTitle: "运营设置",
    groupDescription: "管理广告、站点规则、图片维护和审计记录。",
    icon: ScrollText,
    permissionKeys: ["view_admin_audit_logs", "view_audit_logs"],
  },
];

export function getAdminModule(key: string) {
  return ADMIN_MODULES.find((module) => module.key === key);
}

export function isAdminModuleKey(value: string): value is AdminModuleKey {
  return ADMIN_MODULES.some((module) => module.key === value);
}
