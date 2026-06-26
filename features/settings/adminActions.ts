"use server";

import { revalidatePath } from "next/cache";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { hasAdminModulePermission } from "@/lib/permissions/admin";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DAILY_POST_LIMIT_KEY, normalizeDailyPostLimit } from "./adminQueries";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type AdminSettingsActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseServerClient; userId: string };

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });

export async function updateDailyPostLimit(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getAdminSettingsActionContext();
  if (!context.ok) return fail(context.message);

  const rawLimit = formData.get("daily_post_limit");
  const parsedLimit = typeof rawLimit === "string" ? Number(rawLimit) : Number.NaN;
  if (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > 100 || !Number.isInteger(parsedLimit)) {
    return fail("请输入 1~100 之间的整数。");
  }

  const before = await readSiteSetting(context.supabase, DAILY_POST_LIMIT_KEY);
  const payload = {
    key: DAILY_POST_LIMIT_KEY,
    value: { dailyPostLimit: parsedLimit },
    description: "每个账号每天最多可发布的信息总数。",
    is_public: false,
    updated_by: context.userId,
    updated_at: new Date().toISOString(),
  };

  const { error } = await context.supabase.from("site_settings").upsert(payload, { onConflict: "key" });
  if (error) return fail("每日发布上限保存失败，请稍后再试。");

  const audited = await writeAuditLog(context, "update_site_setting", DAILY_POST_LIMIT_KEY, before, payload);
  if (!audited) return fail("设置已保存，但审计日志写入失败，请联系管理员检查 admin_audit_logs。");

  revalidatePath("/admin/user-posts");
  return ok(`每日发布上限已保存为 ${parsedLimit} 条。`);
}

async function getAdminSettingsActionContext(): Promise<AdminSettingsActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法保存站点设置。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminModulePermission("user-posts", "moderate_posts"))) {
    return { ok: false, message: "当前账号没有用户发布信息管理权限。" };
  }

  return { ok: true, supabase, userId: user.id };
}

async function readSiteSetting(supabase: SupabaseServerClient, key: string) {
  const { data } = await supabase
    .from("site_settings")
    .select("key,value,description,is_public,updated_by,created_at,updated_at")
    .eq("key", key)
    .maybeSingle();

  if (!data) return null;
  return {
    ...data,
    normalized_daily_post_limit: normalizeDailyPostLimit((data as { value?: unknown }).value),
  };
}

async function writeAuditLog(
  context: Extract<AdminSettingsActionContext, { ok: true }>,
  action: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  return writeAdminAuditLog({
    actorId: context.userId,
    action,
    entityType: "site_settings",
    entityId,
    beforeData,
    afterData,
  });
}
