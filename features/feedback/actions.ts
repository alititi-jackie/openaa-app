"use server";

import { revalidatePath } from "next/cache";
import { hasAdminPermission } from "@/lib/permissions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFeedbackStatus, type FeedbackStatus } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type FeedbackActionState = {
  ok: boolean;
  message: string;
};

type AdminFeedbackActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseServerClient; userId: string };

const ok = (message: string): FeedbackActionState => ({ ok: true, message });
const fail = (message: string): FeedbackActionState => ({ ok: false, message });

export async function submitFeedback(_state: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("反馈暂时无法提交，请稍后再试。");

  const category = readText(formData, "category") || "issue";
  const email = readText(formData, "email");
  const subject = readText(formData, "subject");
  const message = readText(formData, "message");

  if (!subject || subject.length < 2) return fail("请填写反馈标题。");
  if (!message || message.length < 5) return fail("请填写反馈内容。");
  if (subject.length > 120) return fail("反馈标题请控制在 120 字以内。");
  if (message.length > 2000) return fail("反馈内容请控制在 2000 字以内。");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("请填写有效的邮箱地址。");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    email: email || user?.email || null,
    category,
    subject,
    message,
    status: "open",
  });

  if (error) return fail("反馈提交失败，请稍后再试。");

  revalidatePath("/feedback");
  revalidatePath("/admin/feedback");
  return ok("反馈已提交，我们会尽快处理。");
}

export async function updateFeedbackStatus(_state: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  const id = readText(formData, "id");
  const status = readText(formData, "status");

  if (!id || !isFeedbackStatus(status)) return fail("操作参数无效。");

  const context = await getAdminFeedbackActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readFeedback(context.supabase, id);
  if (!before) return fail("反馈不存在或无权读取。");
  if (before.status === status) return ok("反馈状态未变化。");

  const now = new Date().toISOString();
  const payload = {
    status,
    handled_by: status === "open" ? null : context.userId,
    handled_at: status === "open" ? null : now,
    updated_at: now,
  };

  const { error } = await context.supabase.from("feedback").update(payload).eq("id", id);
  if (error) return fail("反馈状态更新失败，请稍后再试。");

  const audited = await writeAuditLog(context, auditActionForStatus(status), id, before, {
    feedback_id: id,
    old_status: before.status,
    new_status: status,
    category: before.category,
    subject: before.subject,
    metadata: { source: "admin_feedback_management", changed_at: now },
  });
  if (!audited) return fail("反馈状态已更新，但审计日志写入失败。");

  revalidatePath("/admin/feedback");
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
  const payload = { admin_note: adminNote || null, handled_by: context.userId, handled_at: now, updated_at: now };
  const { error } = await context.supabase.from("feedback").update(payload).eq("id", id);
  if (error) return fail("反馈备注保存失败，请稍后再试。");

  const audited = await writeAuditLog(context, "update_feedback_note", id, before, {
    feedback_id: id,
    category: before.category,
    subject: before.subject,
    metadata: { source: "admin_feedback_management", note_updated_at: now },
  });
  if (!audited) return fail("反馈备注已保存，但审计日志写入失败。");

  revalidatePath("/admin/feedback");
  return ok("反馈备注已保存。");
}

async function getAdminFeedbackActionContext(): Promise<AdminFeedbackActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法处理反馈。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminPermission("handle_feedback"))) {
    return { ok: false, message: "当前账号没有处理反馈的后台权限。" };
  }

  return { ok: true, supabase, userId: user.id };
}

async function readFeedback(supabase: SupabaseServerClient, id: string) {
  const { data, error } = await supabase
    .from("feedback")
    .select("id,user_id,email,category,subject,message,status,admin_note,handled_by,handled_at,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as {
    id: string;
    user_id: string | null;
    email: string | null;
    category: string | null;
    subject: string;
    message: string;
    status: FeedbackStatus;
    admin_note: string | null;
    handled_by: string | null;
    handled_at: string | null;
    created_at: string;
    updated_at: string;
  };
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
    entity_type: "feedback",
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });
  return !error;
}

function auditActionForStatus(status: FeedbackStatus) {
  if (status === "in_review") return "review_feedback";
  if (status === "resolved") return "resolve_feedback";
  if (status === "closed") return "close_feedback";
  return "reopen_feedback";
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
