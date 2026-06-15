"use server";

import { revalidatePath } from "next/cache";
import { hasAnyAdminModulePermission } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PostType } from "@/features/posts/types";
import type { ReportStatus } from "./adminQueries";

export type AdminReportActionState = {
  ok: boolean;
  message: string;
};

type AdminReportActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      userId: string;
      supabase: ReturnType<typeof createSupabaseAdminClient>;
    };

const ok = (message: string): AdminReportActionState => ({ ok: true, message });
const fail = (message: string): AdminReportActionState => ({ ok: false, message });

const reportStatusActions: Record<string, { status: ReportStatus; auditAction: string; label: string }> = {
  resolve: { status: "resolved", auditAction: "resolve_report", label: "已处理" },
  dismiss: { status: "rejected", auditAction: "dismiss_report", label: "已驳回" },
  reopen: { status: "open", auditAction: "reopen_report", label: "已重新打开" },
};

export async function setAdminReportStatus(_state: AdminReportActionState, formData: FormData): Promise<AdminReportActionState> {
  const id = readText(formData, "id");
  const action = readText(formData, "action");
  const config = reportStatusActions[action];

  if (!id || !config) {
    return fail("操作参数无效。");
  }

  const context = await getAdminReportActionContext(["handle_post_reports", "handle_reports"]);
  if (!context.ok) return fail(context.message);

  const before = await readReport(context.supabase, id);
  if (!before) return fail("举报不存在或无法读取。");
  if (before.status === config.status) return ok(`举报状态已是${config.label}。`);

  const now = new Date().toISOString();
  const { error } = await context.supabase
    .from("post_reports")
    .update({
      status: config.status,
      handler_id: context.userId,
      resolved_at: config.status === "open" ? null : now,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return fail("举报状态更新失败，请稍后再试。");

  const audited = await writeAuditLog(context, config.auditAction, id, before, {
    report_id: id,
    target_post_id: before.post_id,
    old_status: before.status,
    new_status: config.status,
    reason: before.reason,
    post_type: before.posts?.post_type ?? null,
    metadata: {
      source: "admin_reports_management",
      report_status_changed_at: now,
    },
  });
  if (!audited) return fail("举报状态已更新，但审计日志写入失败。");

  revalidatePath("/admin/messages");
  revalidatePath("/admin/user-posts");
  return ok(`举报状态${config.label}。`);
}

async function getAdminReportActionContext(permissionKeys: string[]): Promise<AdminReportActionContext> {
  const serverClient = await createSupabaseServerClient();
  if (!serverClient) return { ok: false, message: "Supabase 环境变量尚未配置，暂时无法处理举报。" };

  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (await hasAnyAdminModulePermission("messages", permissionKeys)) {
    try {
      return { ok: true, userId: user.id, supabase: createSupabaseAdminClient() };
    } catch {
      return { ok: false, message: "Supabase service role 环境变量尚未配置，暂时无法处理举报。" };
    }
  }

  return { ok: false, message: "当前账号没有处理举报的后台权限。" };
}

async function readReport(supabase: ReturnType<typeof createSupabaseAdminClient>, id: string) {
  const { data, error } = await supabase
    .from("post_reports")
    .select("id,post_id,reporter_id,reason,detail,status,created_at,updated_at,posts(post_type,title,status)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const record = data as unknown as {
    id: string;
    post_id: string;
    reporter_id: string | null;
    reason: string;
    detail: string | null;
    status: ReportStatus;
    created_at: string;
    updated_at: string;
    posts?: { post_type: PostType; title: string; status: string }[] | { post_type: PostType; title: string; status: string } | null;
  };

  return {
    ...record,
    posts: Array.isArray(record.posts) ? (record.posts[0] ?? null) : (record.posts ?? null),
  };
}

async function writeAuditLog(
  context: Extract<AdminReportActionContext, { ok: true }>,
  action: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: "post_reports",
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });

  return !error;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
