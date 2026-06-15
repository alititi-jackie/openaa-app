import type { AdminRoleName } from "@/lib/supabase/types";
import type { AdminModuleKey } from "@/features/admin/adminModules";

export const adminRoleLabels: Record<AdminRoleName, string> = {
  super_admin: "超级管理员",
  admin: "管理员",
  editor: "编辑",
  moderator: "审核员",
  support: "客服",
};

export const adminRoleOptions: Array<{ value: AdminRoleName; label: string }> = [
  { value: "support", label: adminRoleLabels.support },
  { value: "moderator", label: adminRoleLabels.moderator },
  { value: "editor", label: adminRoleLabels.editor },
  { value: "admin", label: adminRoleLabels.admin },
  { value: "super_admin", label: adminRoleLabels.super_admin },
];

export const adminRoleDescriptions: Record<AdminRoleName, string> = {
  support: "适合处理用户反馈、基础沟通和站内通知，不参与内容裁定、站点设置和高风险后台操作。选择后会自动套用客服常用功能，主管理员可继续增减授权。",
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
    label: "取消改名限制",
    description: "当前仅保留配置，普通用户改名次数/间隔限制上线后生效。",
  },
] as const;

export type AdminExemptionKey = (typeof adminExemptionOptions)[number]["key"];
