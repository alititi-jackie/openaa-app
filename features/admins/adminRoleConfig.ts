import type { AdminRoleName } from "@/lib/supabase/types";
import type { AdminModuleKey } from "@/features/admin/adminModules";

export const adminRoleLabels: Record<AdminRoleName, string> = {
  super_admin: "超级管理员",
  admin: "管理员",
  editor: "编辑",
  moderator: "审核员",
  support: "客服",
};

const adminStatusLabels: Record<string, string> = {
  active: "启用",
  disabled: "停用",
  inactive: "停用",
  restricted: "受限",
  banned: "封禁",
  pending: "待完善",
};

const adminPermissionLabels: Record<string, string> = {
  super_admin: "超级管理员权限",
  "user-posts": "用户发布信息模块",
  messages: "消息中心模块",
  news: "新闻管理模块",
  navigation: "导航管理模块",
  home: "首页配置模块",
  ads: "广告管理模块",
  "recycle-bin": "回收站模块",
  users: "用户管理模块",
  settings: "站点设置模块",
  "audit-logs": "审计日志模块",
  "admin-access": "管理员授权模块",
  view_posts: "查看发布信息",
  view_post_contacts: "查看发布联系方式",
  moderate_posts: "审核发布信息",
  approve_posts: "通过发布审核",
  reject_posts: "拒绝发布审核",
  hide_posts: "下架发布信息",
  restore_posts: "恢复发布信息",
  delete_posts: "删除发布信息",
  view_news: "查看新闻",
  create_news: "新增新闻",
  edit_news: "编辑新闻",
  publish_news: "发布新闻",
  delete_news: "删除新闻",
  manage_news_categories: "管理新闻分类",
  manage_navigation: "管理公共导航",
  manage_top_links: "管理顶部快捷链接",
  manage_home_sections: "管理首页模块",
  manage_latest_ticker: "管理首页滚动信息",
  manage_ads: "管理广告",
  view_users: "查看用户",
  view_user_contacts: "查看用户联系方式",
  edit_user_notes: "编辑用户备注",
  restrict_users: "限制用户",
  ban_users: "封禁用户",
  restore_users: "恢复用户",
  manage_user_status: "管理用户状态",
  view_user_posts: "查看用户发布",
  view_settings: "查看站点设置",
  manage_settings: "管理站点设置",
  manage_rate_limits: "管理频率限制",
  manage_sensitive_words: "管理敏感词",
  view_search_logs: "查看搜索日志",
  view_images: "查看图片资产",
  delete_images: "删除图片资产",
  manage_image_assets: "管理图片资产",
  view_admin_audit_logs: "查看管理员审计日志",
  view_audit_logs: "查看审计日志",
  view_admins: "查看管理员",
  add_admins: "新增管理员",
  edit_admin_roles: "调整管理员角色",
  edit_admin_permissions: "调整管理员权限",
  disable_admins: "停用管理员",
  restore_admins: "恢复管理员",
  manage_admins: "管理管理员",
  view_dmv_questions: "查看 DMV 题库",
  import_dmv_questions: "导入 DMV 题库",
  edit_dmv_questions: "编辑 DMV 题库",
  disable_dmv_questions: "停用 DMV 题目",
  manage_dmv_questions: "管理 DMV 题库",
};

export function getAdminRoleLabel(role: AdminRoleName | string | null | undefined) {
  if (!role) return "未授权";
  return role in adminRoleLabels ? adminRoleLabels[role as AdminRoleName] : "未命名角色";
}

export function getAdminStatusLabel(status: string | boolean | null | undefined) {
  if (typeof status === "boolean") return status ? "启用" : "停用";
  if (!status) return "未知";
  return adminStatusLabels[status] ?? "未知状态";
}

export function getAdminPermissionLabel(permissionKey: string | null | undefined): string {
  if (!permissionKey) return "未命名权限";
  const trimmed = permissionKey.trim();
  if (!trimmed) return "未命名权限";
  if (trimmed.includes("/")) {
    return trimmed
      .split("/")
      .map((part) => getAdminPermissionLabel(part))
      .join(" / ");
  }
  if (adminPermissionLabels[trimmed]) return adminPermissionLabels[trimmed];
  if (/^[a-z][a-z0-9_-]*$/.test(trimmed)) return "未命名权限";
  return trimmed;
}

export const adminRoleOptions: Array<{ value: AdminRoleName; label: string }> = [
  { value: "support", label: adminRoleLabels.support },
  { value: "moderator", label: adminRoleLabels.moderator },
  { value: "editor", label: adminRoleLabels.editor },
  { value: "admin", label: adminRoleLabels.admin },
  { value: "super_admin", label: adminRoleLabels.super_admin },
];

export const adminRoleDescriptions: Record<AdminRoleName, string> = {
  support: "适合处理用户反馈、基础沟通和联系用户，不参与内容裁定、站点设置和高风险后台操作。选择后会自动套用客服常用功能，主管理员可继续增减授权。",
  moderator: "适合处理用户发布信息、举报内容和回收站内的内容复核，不默认参与站点配置、广告运营或管理员授权。",
  editor: "适合维护新闻、公共导航、首页内容和广告运营模块，不默认参与用户账号处置和管理员授权。",
  admin: "适合管理大部分日常后台功能，包括内容、用户、消息、运营设置和审计查看，但不默认负责管理员授权及最高风险操作。",
  super_admin: "拥有全部后台权限，可管理管理员授权、站点设置和高风险操作。超级管理员只能由超级管理员管理，系统必须至少保留一个启用的超级管理员。",
};

export const adminRoleDefaultModules: Record<AdminRoleName, AdminModuleKey[]> = {
  support: ["messages"],
  moderator: ["user-posts", "messages", "recycle-bin"],
  editor: ["news", "navigation", "home", "ads"],
  admin: ["user-posts", "messages", "news", "navigation", "home", "ads", "users", "settings", "audit-logs"],
  super_admin: [
    "user-posts",
    "messages",
    "news",
    "navigation",
    "home",
    "ads",
    "recycle-bin",
    "users",
    "settings",
    "audit-logs",
    "admin-access",
  ],
};

export const adminExemptionOptions = [
  {
    key: "daily_post_limit",
    label: "取消每日发帖限制",
    description: "允许该管理员不受网站每日发布数量限制。",
  },
  {
    key: "rename_limit",
    label: "允许使用保留用户名",
    description: "允许该管理员使用普通用户不能使用的保留用户名或保留昵称。",
  },
] as const;

export type AdminExemptionKey = (typeof adminExemptionOptions)[number]["key"];
