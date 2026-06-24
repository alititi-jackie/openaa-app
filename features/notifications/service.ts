import "server-only";

import { writeAdminAuditLog } from "@/lib/permissions/adminAuditLog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { PostType } from "@/features/posts/types";

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

export type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  type?: string;
  targetType?: string | null;
  targetId?: string | null;
  actionUrl?: string | null;
  linkUrl?: string | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
};

export type NotificationSendResult = {
  ok: boolean;
  notificationIds: string[];
  error?: string;
};

export type NotificationTemplate = {
  id: string;
  key: string;
  title: string;
  body: string;
  type: string;
  target_type: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
};

const DEFAULT_NOTIFICATION_TYPE = "system";

export async function createNotification(input: NotificationInput, supabase = createSupabaseAdminClient()): Promise<NotificationSendResult> {
  const normalized = normalizeNotificationInput(input);
  if (!normalized.ok) return { ok: false, notificationIds: [], error: normalized.error };

  const { data, error } = await supabase
    .from("notifications")
    .insert(normalized.value)
    .select("id")
    .single();

  if (error || !data) {
    await writeNotificationAuditLog(supabase, {
      actorId: input.createdBy ?? null,
      action: "create_notification_failed",
      entityId: input.userId,
      afterData: { error: error?.message ?? "Notification insert returned no row.", input: safeAuditNotificationInput(input) },
    });
    return { ok: false, notificationIds: [], error: error?.message ?? "Notification insert returned no row." };
  }

  await writeNotificationAuditLog(supabase, {
    actorId: input.createdBy ?? null,
    action: "create_notification",
    entityId: String(data.id),
    afterData: { notification_id: data.id, user_id: input.userId, target_type: input.targetType ?? null, target_id: input.targetId ?? null },
  });

  return { ok: true, notificationIds: [String(data.id)] };
}

export async function sendNotificationToUser(input: NotificationInput, supabase = createSupabaseAdminClient()) {
  return createNotification(input, supabase);
}

export async function sendNotificationToUsers(inputs: NotificationInput[], supabase = createSupabaseAdminClient()): Promise<NotificationSendResult> {
  if (inputs.length === 0) return { ok: false, notificationIds: [], error: "No notification recipients." };

  const rows = [];
  for (const input of inputs) {
    const normalized = normalizeNotificationInput(input);
    if (!normalized.ok) return { ok: false, notificationIds: [], error: normalized.error };
    rows.push(normalized.value);
  }

  const { data, error } = await supabase.from("notifications").insert(rows).select("id");
  if (error) {
    await writeNotificationAuditLog(supabase, {
      actorId: inputs[0]?.createdBy ?? null,
      action: "bulk_create_notifications_failed",
      entityId: "bulk",
      afterData: { error: error.message, count: inputs.length },
    });
    return { ok: false, notificationIds: [], error: error.message };
  }

  const ids = (data ?? []).map((row) => String(row.id));
  await writeNotificationAuditLog(supabase, {
    actorId: inputs[0]?.createdBy ?? null,
    action: "bulk_create_notifications",
    entityId: "bulk",
    afterData: { notification_count: ids.length, notification_ids: ids },
  });

  return { ok: true, notificationIds: ids };
}

export async function sendNotificationFromTemplate({
  templateKey,
  userId,
  title,
  body,
  targetType,
  targetId,
  actionUrl,
  createdBy,
  metadata,
  supabase = createSupabaseAdminClient(),
}: {
  templateKey: string;
  userId: string;
  title?: string | null;
  body?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  actionUrl?: string | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown> | null;
  supabase?: AdminSupabaseClient;
}) {
  const template = await getNotificationTemplate(templateKey, supabase);
  if (!template) return { ok: false, notificationIds: [], error: "Notification template not found." };

  return sendNotificationToUser(
    {
      userId,
      title: title?.trim() || template.title,
      body: body?.trim() || template.body,
      type: template.type,
      targetType: targetType ?? template.target_type,
      targetId,
      actionUrl,
      createdBy,
      metadata: { template_key: templateKey, ...(metadata ?? {}) },
    },
    supabase,
  );
}

export async function getNotificationTemplate(key: string, supabase = createSupabaseAdminClient()): Promise<NotificationTemplate | null> {
  const { data, error } = await supabase
    .from("notification_templates")
    .select("id,key,title,body,type,target_type,is_active,metadata")
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeTemplate(data);
}

export async function getActiveNotificationTemplates(supabase = createSupabaseAdminClient()): Promise<NotificationTemplate[]> {
  const { data, error } = await supabase
    .from("notification_templates")
    .select("id,key,title,body,type,target_type,is_active,metadata")
    .eq("is_active", true)
    .order("key", { ascending: true });

  if (error) return [];
  return ((data ?? []) as unknown[]).map(normalizeTemplate);
}

export async function getNotificationRecipients(scope: "all" | "active", supabase = createSupabaseAdminClient()) {
  let query = supabase.from("profiles").select("id").limit(10000);
  if (scope === "active") query = query.eq("status", "active");
  const { data, error } = await query;
  if (error) return { ok: false as const, userIds: [], error: error.message };
  return { ok: true as const, userIds: (data ?? []).map((row) => String(row.id)).filter(Boolean) };
}

export function getNotificationActionUrl(targetType?: string | null, targetId?: string | null, postType?: PostType | null) {
  if (!targetType || !targetId) return null;
  if (targetType === "post" && postType && POST_TYPE_TO_ROUTE[postType]) {
    return `${POST_TYPE_TO_ROUTE[postType]}/${targetId}`;
  }
  if (targetType === "profile") return "/profile";
  return null;
}

export async function writeNotificationAuditLog(
  supabase: AdminSupabaseClient,
  {
    actorId,
    action,
    entityId,
    beforeData,
    afterData,
  }: {
    actorId?: string | null;
    action: string;
    entityId: string;
    beforeData?: unknown;
    afterData?: unknown;
  },
) {
  void supabase;

  return writeAdminAuditLog({
    actorId: actorId ?? null,
    action,
    entityType: "notifications",
    entityId,
    beforeData,
    afterData,
  });
}

function normalizeNotificationInput(input: NotificationInput) {
  const title = input.title.trim();
  const body = input.body.trim();
  const userId = input.userId.trim();
  if (!userId) return { ok: false as const, error: "Notification user_id is required." };
  if (!title) return { ok: false as const, error: "Notification title is required." };
  if (!body) return { ok: false as const, error: "Notification body is required." };

  const actionUrl = normalizeOptionalText(input.actionUrl);
  const linkUrl = normalizeOptionalText(input.linkUrl) ?? actionUrl;
  const metadata = input.metadata ?? {};

  return {
    ok: true as const,
    value: {
      user_id: userId,
      type: input.type?.trim() || DEFAULT_NOTIFICATION_TYPE,
      title,
      body,
      link_url: linkUrl,
      data: input.data ?? metadata,
      target_type: normalizeOptionalText(input.targetType),
      target_id: normalizeOptionalText(input.targetId),
      action_url: actionUrl,
      created_by: normalizeOptionalText(input.createdBy),
      metadata,
    },
  };
}

function normalizeTemplate(value: unknown): NotificationTemplate {
  const row = value as {
    id?: string | null;
    key: string;
    title: string;
    body: string;
    type?: string | null;
    target_type?: string | null;
    is_active: boolean;
    metadata?: Record<string, unknown> | null;
  };
  const metadata = row.metadata ?? {};
  return {
    id: row.id ?? row.key,
    key: row.key,
    title: row.title,
    body: row.body,
    type: row.type?.trim() || stringFromMetadata(metadata.type) || DEFAULT_NOTIFICATION_TYPE,
    target_type: row.target_type ?? stringFromMetadata(metadata.target_type),
    is_active: row.is_active,
    metadata,
  };
}

function stringFromMetadata(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeOptionalText(value?: string | null) {
  const text = value?.trim();
  return text || null;
}

function safeAuditNotificationInput(input: NotificationInput) {
  return {
    userId: input.userId,
    type: input.type,
    title: input.title,
    targetType: input.targetType,
    targetId: input.targetId,
    actionUrl: input.actionUrl,
    createdBy: input.createdBy,
  };
}
