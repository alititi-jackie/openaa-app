"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminModulePermission } from "@/lib/permissions/admin";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import {
  POST_VIEW_SETTING_KEY,
  normalizePostViewSettings,
  type PostViewSettings,
} from "./viewSettings";

export async function updatePostViewSettings(value: PostViewSettings) {
  if (
    !value ||
    typeof value.detail !== "boolean" ||
    typeof value.list !== "boolean"
  )
    return { ok: false, message: "设置格式不正确。" };
  const supabase = await createSupabaseServerClient();
  if (!supabase || !(await hasAdminModulePermission("user-posts", "moderate_posts")))
    return { ok: false, message: "没有用户发布信息管理权限，无法修改显示设置。" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录。" };
  const { data: before, error: readError } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", POST_VIEW_SETTING_KEY)
    .single();
  if (readError) return { ok: false, message: "无法读取设置，请刷新后重试。" };
  const settings = normalizePostViewSettings(value);
  const { data, error } = await supabase
    .from("site_settings")
    .update({
      value: settings,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", POST_VIEW_SETTING_KEY)
    .select("key")
    .single();
  if (error || !data) return { ok: false, message: "保存失败，请稍后再试。" };
  const audited = await writeAdminAuditLog({
    actorId: user.id,
    action: "update_site_setting",
    entityType: "site_settings",
    entityId: POST_VIEW_SETTING_KEY,
    beforeData: before.value,
    afterData: settings,
  });
  revalidatePath("/admin/user-posts");
  for (const path of ["/jobs", "/housing", "/marketplace", "/services"]) revalidatePath(path, "layout");
  revalidatePath("/");
  revalidatePath("/search");
  return {
    ok: true,
    message: audited ? "已保存" : "设置已保存，但操作日志写入失败。",
  };
}
