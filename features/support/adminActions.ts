"use server";

import { revalidatePath } from "next/cache";
import { hasAdminModulePermission } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isSupportTicketPriority,
  isSupportTicketStatus,
  type SupportTicketPriority,
  type SupportTicketSettings,
  type SupportTicketStatus,
} from "./types";
import { getSupportTicketSettings } from "./adminQueries";

type SupportActionState = {
  ok: boolean;
  message: string;
};

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

type SupportActionContext =
  | { ok: false; message: string }
  | { ok: true; supabase: SupabaseAdminClient; userId: string };

type SupportTicketRow = {
  id: string;
  ticket_no: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  admin_reply: string | null;
  admin_note: string | null;
  handled_by: string | null;
  handled_at: string | null;
  closed_at: string | null;
  type: string;
};

const ok = (message: string): SupportActionState => ({ ok: true, message });
const fail = (message: string): SupportActionState => ({ ok: false, message });

export async function updateSupportTicket(_state: SupportActionState, formData: FormData): Promise<SupportActionState> {
  const id = readText(formData, "id");
  const status = readText(formData, "status");
  const priority = readText(formData, "priority");
  const adminReply = readText(formData, "admin_reply");
  const adminNote = readText(formData, "admin_note");

  if (!id || !isSupportTicketStatus(status) || !isSupportTicketPriority(priority)) {
    return fail("操作参数无效。");
  }

  const context = await getSupportActionContext();
  if (!context.ok) return fail(context.message);

  const before = await readTicket(context.supabase, id);
  if (!before) return fail("工单不存在或无权读取。");

  const now = new Date().toISOString();
  const payload = {
    status,
    priority,
    admin_reply: adminReply || null,
    admin_note: adminNote || null,
    handled_by: context.userId,
    handled_at: now,
    closed_at: status === "closed" ? before.closed_at ?? now : null,
  };

  const changedFields = diffTicket(before, payload);
  if (changedFields.length === 0) return ok("工单未发生变化。");

  const { error } = await context.supabase.from("support_tickets").update(payload).eq("id", id);
  if (error) return fail("工单保存失败，请稍后再试。");

  const after = { ...before, ...payload };
  const audited = await writeAuditLog(context, "update_support_ticket", "support_tickets", id, before, {
    ticket_id: id,
    ticket_no: before.ticket_no,
    changed_fields: changedFields,
    status,
    priority,
    metadata: { source: "admin_support_management", updated_at: now },
  });
  if (!audited) return fail("工单已保存，但审计日志写入失败。");

  const eventsWritten = await writeTicketEvents(context, before, after, changedFields);
  if (!eventsWritten) return fail("工单已保存，但事件记录写入失败。");

  revalidatePath("/admin/support");
  return ok("工单已保存。");
}

export async function updateSupportTicketSettings(_state: SupportActionState, formData: FormData): Promise<SupportActionState> {
  const nextSettings = readSettingsForm(formData);
  if (!nextSettings.ok) return fail(nextSettings.message);

  const context = await getSupportActionContext();
  if (!context.ok) return fail(context.message);

  const before = await getSupportTicketSettings(context.supabase);
  const now = new Date().toISOString();
  const rows = [
    { key: "enabled", value: String(nextSettings.value.enabled), updated_by: context.userId, updated_at: now },
    { key: "daily_user_limit", value: String(nextSettings.value.dailyUserLimit), updated_by: context.userId, updated_at: now },
    { key: "daily_visitor_limit", value: String(nextSettings.value.dailyVisitorLimit), updated_by: context.userId, updated_at: now },
    { key: "daily_total_limit", value: String(nextSettings.value.dailyTotalLimit), updated_by: context.userId, updated_at: now },
    { key: "content_min_length", value: String(nextSettings.value.contentMinLength), updated_by: context.userId, updated_at: now },
    { key: "content_max_length", value: String(nextSettings.value.contentMaxLength), updated_by: context.userId, updated_at: now },
    { key: "contact_max_length", value: String(nextSettings.value.contactMaxLength), updated_by: context.userId, updated_at: now },
    { key: "related_url_max_length", value: String(nextSettings.value.relatedUrlMaxLength), updated_by: context.userId, updated_at: now },
  ];

  const { error } = await context.supabase.from("support_ticket_settings").upsert(rows, { onConflict: "key" });
  if (error) return fail("反馈设置保存失败，请稍后再试。");

  const audited = await writeAuditLog(context, "update_support_ticket_settings", "support_ticket_settings", "support_ticket_settings", before, {
    ...nextSettings.value,
    metadata: { source: "admin_support_management", updated_at: now },
  });
  if (!audited) return fail("反馈设置已保存，但审计日志写入失败。");

  revalidatePath("/admin/support");
  return ok("反馈设置已保存。");
}

async function getSupportActionContext(): Promise<SupportActionContext> {
  const serverClient = await createSupabaseServerClient();
  if (!serverClient) return { ok: false, message: "Supabase 环境变量未配置，暂时无法处理工单。" };

  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  if (!(await hasAdminModulePermission("support", "handle_support_tickets"))) {
    return { ok: false, message: "当前账号没有处理反馈与举报的后台权限。" };
  }

  try {
    return { ok: true, supabase: createSupabaseAdminClient(), userId: user.id };
  } catch {
    return { ok: false, message: "Supabase service role 环境变量未配置，暂时无法处理工单。" };
  }
}

async function readTicket(supabase: SupabaseAdminClient, id: string) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id,ticket_no,status,priority,admin_reply,admin_note,handled_by,handled_at,closed_at,type")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as SupportTicketRow;
}

function diffTicket(before: SupportTicketRow, after: {
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  admin_reply: string | null;
  admin_note: string | null;
  handled_by: string;
  handled_at: string;
  closed_at: string | null;
}) {
  const fields: string[] = [];
  if (before.status !== after.status) fields.push("status");
  if (before.priority !== after.priority) fields.push("priority");
  if ((before.admin_reply ?? "") !== (after.admin_reply ?? "")) fields.push("admin_reply");
  if ((before.admin_note ?? "") !== (after.admin_note ?? "")) fields.push("admin_note");
  return fields;
}

async function writeTicketEvents(
  context: Extract<SupportActionContext, { ok: true }>,
  before: SupportTicketRow,
  after: SupportTicketRow,
  changedFields: string[],
) {
  const events = changedFields.map((field) => ({
    ticket_id: before.id,
    actor_id: context.userId,
    event_type: eventTypeForField(field),
    before_data: { [field]: before[field as keyof SupportTicketRow] ?? null },
    after_data: { [field]: after[field as keyof SupportTicketRow] ?? null },
  }));
  if (events.length === 0) return true;
  const { error } = await context.supabase.from("support_ticket_events").insert(events);
  return !error;
}

function eventTypeForField(field: string) {
  if (field === "status") return "change_status";
  if (field === "priority") return "change_priority";
  if (field === "admin_reply") return "update_admin_reply";
  if (field === "admin_note") return "update_admin_note";
  return "update_ticket";
}

function readSettingsForm(formData: FormData): { ok: true; value: SupportTicketSettings } | { ok: false; message: string } {
  const enabled = formData.get("enabled") === "on";
  const dailyUserLimit = readInteger(formData, "daily_user_limit", 1, 1000);
  const dailyVisitorLimit = readInteger(formData, "daily_visitor_limit", 1, 1000);
  const dailyTotalLimit = readInteger(formData, "daily_total_limit", 1, 10000);
  const contentMinLength = readInteger(formData, "content_min_length", 1, 1000);
  const contentMaxLength = readInteger(formData, "content_max_length", 10, 20000);
  const contactMaxLength = readInteger(formData, "contact_max_length", 1, 1000);
  const relatedUrlMaxLength = readInteger(formData, "related_url_max_length", 1, 2000);

  if (!dailyUserLimit || !dailyVisitorLimit || !dailyTotalLimit || !contentMinLength || !contentMaxLength || !contactMaxLength || !relatedUrlMaxLength) {
    return { ok: false, message: "请填写有效的设置数值。" };
  }
  if (contentMinLength > contentMaxLength) return { ok: false, message: "内容最少字数不能大于最多字数。" };
  if (dailyUserLimit > dailyTotalLimit || dailyVisitorLimit > dailyTotalLimit) {
    return { ok: false, message: "单个用户或访客每日上限不能大于全站每日上限。" };
  }

  return {
    ok: true,
    value: {
      enabled,
      dailyUserLimit,
      dailyVisitorLimit,
      dailyTotalLimit,
      contentMinLength,
      contentMaxLength,
      contactMaxLength,
      relatedUrlMaxLength,
    },
  };
}

async function writeAuditLog(
  context: Extract<SupportActionContext, { ok: true }>,
  action: string,
  entityType: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });
  return !error;
}

function readInteger(formData: FormData, key: string, min: number, max: number) {
  const parsed = Number.parseInt(readText(formData, key), 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
