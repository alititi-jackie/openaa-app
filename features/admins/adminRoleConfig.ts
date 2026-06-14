import type { AdminRoleName } from "@/lib/supabase/types";

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
