"use server";

import { revalidatePath } from "next/cache";
import type { AdminHomeActionState } from "@/features/admin-home/types";
import { POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { PostType } from "@/features/posts/types";
import { REPORT_AUTHOR_MESSAGE_TEMPLATES, isReportReason } from "@/features/reports/types";
import { sendNotificationToUser } from "@/features/notifications/service";
import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import { hasAdminModule } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ok = (message: string): AdminHomeActionState => ({ ok: true, message });
const fail = (message: string): AdminHomeActionState => ({ ok: false, message });

type ActionContext =
  | { ok: false; message: string }
  | { ok: true; userId: string; supabase: ReturnType<typeof createSupabaseAdminClient> };

const ADMIN_REPLY_FOOTER = "如需联系管理员，请在“我的”页面的线索与建议中选择“回复管理员”。";

export async function handleMessageReport(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getMessagesActionContext();
  if (!context.ok) return fail(context.message);

  const id = readText(formData, "id");
  const postAction = readText(formData, "post_action");
  const reason = readText(formData, "admin_reason");
  const editableMessage = readText(formData, "admin_message_editable");
  const notifyAuthor = readText(formData, "notify_author") === "on";
  if (!id) return fail("缺少举报记录。");
  if (postAction !== "none" && postAction !== "hide" && postAction !== "delete") return fail("请选择有效的处理方式。");
  if (!isReportReason(reason)) return fail("请选择有效的处理原因。");

  const before = await readReport(context.supabase, id);
  if (!before) return fail("举报不存在或已被删除。");
  if (before.deleted_at) return fail("该举报已在回收站中，不能重复处理。");
  if (before.status !== "open" && before.status !== "in_review") return fail("该举报已处理，不能重复处理。");
  const post = relationOne(before.posts);
  if (!post) return fail("被举报的信息不存在。");

  const fixedMessage = fixedReportMessage(postAction);
  const now = new Date().toISOString();
  const reportPayload = {
    status: "resolved",
    handler_id: context.userId,
    resolved_at: now,
    post_action: postAction,
    admin_reason: reason,
    admin_message_editable: editableMessage || REPORT_AUTHOR_MESSAGE_TEMPLATES[reason],
    admin_message_fixed: fixedMessage,
    notify_author: notifyAuthor,
    updated_at: now,
  };

  const { error: reportError } = await context.supabase
    .from("post_reports")
    .update(reportPayload)
    .eq("id", id)
    .in("status", ["open", "in_review"])
    .is("deleted_at", null);
  if (reportError) return fail("举报处理失败，请稍后再试。");

  if (postAction === "hide" || postAction === "delete") {
    const postPayload = postAction === "hide"
      ? { status: "hidden", updated_at: now }
      : { status: "deleted", deleted_at: now, deletion_source: "admin", deleted_by: context.userId, updated_at: now };
    const { error: postError } = await context.supabase.from("posts").update(postPayload).eq("id", post.id);
    if (postError) return fail("举报已标记处理，但发布信息状态更新失败。");
  }

  let notificationId: string | null = null;
  let notificationFailed = false;
  if (notifyAuthor && post.author_id) {
    const message = `${reportPayload.admin_message_editable}\n\n${fixedMessage}`;
    const result = await sendNotificationToUser(
      {
        userId: post.author_id,
        title: "你发布的信息已被平台处理",
        body: message,
        type: "content",
        targetType: "post",
        targetId: post.id,
        actionUrl: `${POST_TYPE_TO_ROUTE[post.post_type]}/${post.id}`,
        createdBy: context.userId,
        metadata: { source: "report_handling", report_id: id, post_action: postAction, reason },
      },
      context.supabase,
    );
    if (result.ok) {
      notificationId = result.notificationIds[0] ?? null;
    } else {
      notificationFailed = true;
    }
  }

  await writeAdminAuditLog({
    actorId: context.userId,
    action: "handle_report",
    entityType: "post_reports",
    entityId: id,
    beforeData: before,
    afterData: { ...reportPayload, notification_id: notificationId, notification_failed: notificationFailed },
  });

  revalidateMessages();
  revalidatePost(post.post_type, post.id);
  return ok(notificationFailed ? "举报已处理，但通知作者失败，请到联系用户中手动补发。" : "举报已处理。");
}

export async function softDeleteMessageReport(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getMessagesActionContext();
  if (!context.ok) return fail(context.message);
  const id = readText(formData, "id");
  if (!id) return fail("缺少举报记录。");

  const now = new Date().toISOString();
  const before = await readReport(context.supabase, id);
  if (!before || before.deleted_at) return fail("只能删除已处理且不在回收站中的举报。");
  if (before.status !== "resolved") return fail("请先处理举报，再删除到回收站。");
  const { error } = await context.supabase.from("post_reports").update({ deleted_at: now, deleted_by: context.userId, updated_at: now }).eq("id", id).eq("status", "resolved").is("deleted_at", null);
  if (error) return fail("删除举报失败，请稍后再试。");
  await writeAdminAuditLog({ actorId: context.userId, action: "soft_delete_report", entityType: "post_reports", entityId: id, beforeData: before, afterData: { deleted_at: now } });
  revalidateMessages();
  revalidatePath("/admin/recycle-bin");
  return ok("举报已移入回收站。");
}

export async function markFeedbackViewed(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  return updateFeedbackStatus(formData, "viewed", "反馈已标记为已查看。");
}

export async function softDeleteFeedback(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getMessagesActionContext();
  if (!context.ok) return fail(context.message);
  const id = readText(formData, "id");
  if (!id) return fail("缺少反馈记录。");
  const now = new Date().toISOString();
  const before = await readFeedback(context.supabase, id);
  if (!before || before.deleted_at) return fail("只能删除不在回收站中的线索与建议。");
  const { error } = await context.supabase.from("support_tickets").update({ status: "deleted", deleted_at: now, handled_by: context.userId, handled_at: now, updated_at: now }).eq("id", id).is("deleted_at", null);
  if (error) return fail("删除失败，请稍后再试。");
  await writeAdminAuditLog({ actorId: context.userId, action: "soft_delete_feedback", entityType: "support_tickets", entityId: id, beforeData: before, afterData: { deleted_at: now } });
  revalidateMessages();
  revalidatePath("/admin/recycle-bin");
  return ok("已移入回收站。");
}

export async function contactUserFromMessages(_state: AdminHomeActionState, formData: FormData): Promise<AdminHomeActionState> {
  const context = await getMessagesActionContext();
  if (!context.ok) return fail(context.message);
  const userId = readText(formData, "user_id");
  const title = readText(formData, "title");
  const body = readText(formData, "body");
  if (!userId) return fail("缺少用户。");
  if (!title) return fail("请填写标题。");
  if (body.length < 2) return fail("请填写联系内容。");

  const finalBody = `${body}\n\n${ADMIN_REPLY_FOOTER}`;
  const result = await sendNotificationToUser(
    {
      userId,
      title,
      body: finalBody,
      type: "admin_contact",
      targetType: "profile",
      targetId: userId,
      actionUrl: "/profile/notifications",
      createdBy: context.userId,
      metadata: { source: "admin_contact_user" },
    },
    context.supabase,
  );
  if (!result.ok) return fail("联系用户失败，请稍后再试。");
  revalidateMessages();
  revalidatePath("/profile/notifications");
  return ok("消息已发送给用户。");
}

async function updateFeedbackStatus(formData: FormData, status: "viewed", message: string) {
  const context = await getMessagesActionContext();
  if (!context.ok) return fail(context.message);
  const id = readText(formData, "id");
  if (!id) return fail("缺少反馈记录。");
  const now = new Date().toISOString();
  const before = await readFeedback(context.supabase, id);
  if (!before || before.deleted_at) return fail("只能查看不在回收站中的线索与建议。");
  const { error } = await context.supabase.from("support_tickets").update({ status, handled_by: context.userId, handled_at: now, updated_at: now }).eq("id", id).is("deleted_at", null);
  if (error) return fail("更新失败，请稍后再试。");
  await writeAdminAuditLog({ actorId: context.userId, action: "mark_feedback_viewed", entityType: "support_tickets", entityId: id, beforeData: before, afterData: { status } });
  revalidateMessages();
  return ok(message);
}

async function getMessagesActionContext(): Promise<ActionContext> {
  const server = await createSupabaseServerClient();
  if (!server) return { ok: false, message: "Supabase 环境变量未配置。" };
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };
  if (!(await hasAdminModule("messages"))) return { ok: false, message: "当前账号没有消息中心模块权限。" };
  try {
    return { ok: true, userId: user.id, supabase: createSupabaseAdminClient() };
  } catch {
    return { ok: false, message: "Supabase service role 环境变量未配置。" };
  }
}

async function readReport(supabase: ReturnType<typeof createSupabaseAdminClient>, id: string) {
  const { data } = await supabase
    .from("post_reports")
    .select("id,post_id,reporter_id,reason,detail,status,created_at,deleted_at,posts(id,post_type,title,status,author_id)")
    .eq("id", id)
    .maybeSingle();
  return data as null | {
    id: string;
    status: string;
    deleted_at: string | null;
    posts?: { id: string; post_type: PostType; title: string; status: string; author_id: string | null }[] | { id: string; post_type: PostType; title: string; status: string; author_id: string | null } | null;
  };
}

async function readFeedback(supabase: ReturnType<typeof createSupabaseAdminClient>, id: string) {
  const { data } = await supabase.from("support_tickets").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

function fixedReportMessage(action: string) {
  if (action === "hide") return "现已对此信息作出下架处理。如需重新展示，请修改内容后重新提交或重新上架。";
  if (action === "delete") return "现已对此信息作出删除处理。";
  return "经核查，暂不对此信息作下架或删除处理。";
}

function relationOne<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function revalidateMessages() {
  revalidatePath("/admin/messages");
}

function revalidatePost(type: PostType, id: string) {
  revalidatePath(POST_TYPE_TO_ROUTE[type]);
  revalidatePath(`${POST_TYPE_TO_ROUTE[type]}/${id}`);
  revalidatePath("/admin/user-posts");
  revalidatePath("/admin/recycle-bin");
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
