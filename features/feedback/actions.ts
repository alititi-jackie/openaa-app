"use server";

import { revalidatePath } from "next/cache";
import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFeedbackStatus, type FeedbackStatus } from "./types";

const DEFAULT_USER_DAILY_LIMIT = 5;
const DEFAULT_TOTAL_DAILY_LIMIT = 100;
const LIMIT_MIN = 1;
const LIMIT_MAX = 1000;

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type FeedbackActionState = {
  ok: boolean;
  message: string;
  result?: "idle" | "success" | "limited";
};

type AdminFeedbackActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseAdminClient; userId: string };

const ok = (message: string, result: FeedbackActionState["result"] = "idle"): FeedbackActionState => ({ ok: true, message, result });
const fail = (message: string, result: FeedbackActionState["result"] = "idle"): FeedbackActionState => ({ ok: false, message, result });

export async function updateFeedbackStatus(_state: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  const id = readText(formData, "id");
  const status = readText(formData, "status");

  if (!id || !isFeedbackStatus(status)) return fail("操作参数无效。");

  const context = await getAdminFeedbackActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readFeedback(context.supabase, id);
  if (!before) return fail("反馈不存在或无权读取。");
  if (before.status === status && !before.deleted_at) return ok("反馈状态未变化。");

  const now = new Date().toISOString();
  const payload = {
    status,
    handled_by: status === "pending" ? null : context.userId,
    handled_at: status === "pending" ? null : now,
    deleted_at: null,
  };

  const { error } = await context.supabase.from("feedback_posts").update(payload).eq("id", id);
  if (error) return fail("反馈状态更新失败，请稍后再试。");

  const audited = await writeAuditLog(context, auditActionForStatus(status), id, before, {
    feedback_id: id,
    old_status: before.status,
    new_status: status,
    type: before.type,
    metadata: { source: "admin_feedback_management", changed_at: now },
  });
  if (!audited) return fail("反馈状态已更新，但审计日志写入失败。");

  revalidatePath("/admin/messages");
  return ok("反馈状态已更新。");
}

export async function updateFeedbackNote(_state: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  const id = readText(formData, "id");
  const adminNote = readText(formData, "admin_note");
  if (!id) return fail("操作参数无效。");

  const context = await getAdminFeedbackActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readFeedback(context.supabase, id);
  if (!before) return fail("反馈不存在或无权读取。");

  const now = new Date().toISOString();
  const payload = { admin_note: adminNote || null, handled_by: context.userId, handled_at: now };
  const { error } = await context.supabase.from("feedback_posts").update(payload).eq("id", id);
  if (error) return fail("反馈备注保存失败，请稍后再试。");

  const audited = await writeAuditLog(context, "update_feedback_note", id, before, {
    feedback_id: id,
    type: before.type,
    metadata: { source: "admin_feedback_management", note_updated_at: now },
  });
  if (!audited) return fail("反馈备注已保存，但审计日志写入失败。");

  revalidatePath("/admin/messages");
  return ok("反馈备注已保存。");
}

export async function softDeleteFeedback(_state: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  const id = readText(formData, "id");
  if (!id) return fail("操作参数无效。");

  const context = await getAdminFeedbackActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readFeedback(context.supabase, id);
  if (!before) return fail("反馈不存在或无权读取。");

  const now = new Date().toISOString();
  const { error } = await context.supabase
    .from("feedback_posts")
    .update({ deleted_at: now, handled_by: context.userId, handled_at: now })
    .eq("id", id);
  if (error) return fail("反馈删除失败，请稍后再试。");

  const audited = await writeAuditLog(context, "delete_feedback", id, before, {
    feedback_id: id,
    deleted_at: now,
    metadata: { source: "admin_feedback_management" },
  });
  if (!audited) return fail("反馈已删除，但审计日志写入失败。");

  revalidatePath("/admin/messages");
  return ok("反馈已删除。");
}

export async function updateFeedbackSettings(_state: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  const userDailyLimit = normalizeLimit(readText(formData, "user_daily_limit"));
  const totalDailyLimit = normalizeLimit(readText(formData, "total_daily_limit"));

  if (!userDailyLimit || !totalDailyLimit) return fail("请输入 1~1000 之间的整数。");
  if (userDailyLimit > totalDailyLimit) return fail("单个用户每日上限不能大于全站每日反馈总上限。");

  const context = await getAdminFeedbackActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readFeedbackSettings(context.supabase);
  const now = new Date().toISOString();
  const { error } = await context.supabase.from("feedback_settings").upsert(
    [
      { key: "feedback_daily_user_limit", value: userDailyLimit, updated_by: context.userId, updated_at: now },
      { key: "feedback_daily_total_limit", value: totalDailyLimit, updated_by: context.userId, updated_at: now },
    ],
    { onConflict: "key" },
  );

  if (error) return fail("反馈提交设置保存失败，请稍后再试。");

  const audited = await writeAuditLog(context, "update_feedback_settings", "feedback_settings", before, {
    userDailyLimit,
    totalDailyLimit,
    metadata: { source: "admin_feedback_management", updated_at: now },
  });
  if (!audited) return fail("反馈提交设置已保存，但审计日志写入失败。");

  revalidatePath("/admin/messages");
  return ok("反馈提交设置已保存。");
}

async function getAdminFeedbackActionContext(): Promise<AdminFeedbackActionContext> {
  const serverClient = await createSupabaseServerClient();
  if (!serverClient) return { ok: false, message: "Supabase 环境变量未配置，暂时无法处理反馈。" };

  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminPermission("handle_feedback"))) {
    return { ok: false, message: "当前账号没有处理反馈的后台权限。" };
  }

  try {
    return { ok: true, supabase: createSupabaseAdminClient(), userId: user.id };
  } catch {
    return { ok: false, message: "Supabase service role 环境变量未配置，暂时无法处理反馈。" };
  }
}

async function readFeedback(supabase: SupabaseAdminClient, id: string) {
  const { data, error } = await supabase
    .from("feedback_posts")
    .select("id,user_id,visitor_id,type,contact,related_url,content,status,admin_note,handled_by,handled_at,created_at,updated_at,deleted_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as {
    id: string;
    user_id: string | null;
    visitor_id: string | null;
    type: string;
    contact: string | null;
    related_url: string | null;
    content: string;
    status: FeedbackStatus;
    admin_note: string | null;
    handled_by: string | null;
    handled_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

async function readFeedbackSettings(supabase: SupabaseAdminClient) {
  const { data } = await supabase.from("feedback_settings").select("key,value").in("key", ["feedback_daily_user_limit", "feedback_daily_total_limit"]);
  const rows = (data ?? []) as Array<{ key: string; value: number | null }>;
  const userDailyLimit = normalizeLimit(rows.find((row) => row.key === "feedback_daily_user_limit")?.value) ?? DEFAULT_USER_DAILY_LIMIT;
  const totalDailyLimit = normalizeLimit(rows.find((row) => row.key === "feedback_daily_total_limit")?.value) ?? DEFAULT_TOTAL_DAILY_LIMIT;
  return { userDailyLimit, totalDailyLimit };
}

async function writeAuditLog(
  context: Extract<AdminFeedbackActionContext, { ok: true }>,
  action: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: "feedback_posts",
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });
  return !error;
}

function auditActionForStatus(status: FeedbackStatus) {
  if (status === "processing") return "review_feedback";
  if (status === "resolved") return "resolve_feedback";
  if (status === "ignored") return "ignore_feedback";
  return "reopen_feedback";
}

function normalizeLimit(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed < LIMIT_MIN || parsed > LIMIT_MAX) return null;
  return parsed;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
