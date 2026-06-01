"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST_TYPE_TO_ROUTE } from "./constants";
import { postHref } from "./formMappers";
import type { PostStatus, PostType } from "./types";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type AdminPostActionState = {
  ok: boolean;
  message: string;
};

type AdminActionContext =
  | { ok: false; message: string }
  | {
      ok: true;
      supabase: SupabaseServerClient;
      userId: string;
    };

const ok = (message: string): AdminPostActionState => ({ ok: true, message });
const fail = (message: string): AdminPostActionState => ({ ok: false, message });

const statusPermissions: Record<PostStatus, string[]> = {
  draft: ["moderate_posts"],
  pending_review: ["moderate_posts"],
  published: ["moderate_posts"],
  hidden: ["moderate_posts"],
  rejected: ["moderate_posts"],
  expired: ["moderate_posts"],
  deleted: ["moderate_posts"],
};

async function getAdminActionContext(permissionKeys: string[]): Promise<AdminActionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase 环境变量未配置，暂时无法管理帖子。" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "请先登录管理员账号。" };

  for (const permissionKey of permissionKeys) {
    const { data: allowed } = await supabase.rpc("has_admin_permission", { p_permission_key: permissionKey });
    if (allowed) return { ok: true, supabase, userId: user.id };
  }

  return { ok: false, message: "当前账号没有执行此操作的后台权限。" };
}

async function readPost(supabase: SupabaseServerClient, id: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id,post_type,status,title,author_id,published_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string; post_type: PostType; status: PostStatus; title: string; author_id: string | null; published_at: string | null };
}

async function writeAuditLog(
  context: Extract<AdminActionContext, { ok: true }>,
  action: string,
  entityId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  const { error } = await context.supabase.from("admin_audit_logs").insert({
    actor_id: context.userId,
    action,
    entity_type: "posts",
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });

  return !error;
}

export async function setAdminPostStatus(_state: AdminPostActionState, formData: FormData): Promise<AdminPostActionState> {
  const id = readText(formData, "id");
  const status = readText(formData, "status") as PostStatus;

  if (!id || !isPostStatus(status)) {
    return fail("操作参数无效。");
  }

  const context = await getAdminActionContext(statusPermissions[status]);
  if (!context.ok) return fail(context.message);

  const before = await readPost(context.supabase, id);
  if (!before) return fail("帖子不存在或无权读取。");
  if (before.status === status) return ok("帖子状态未变化。");

  const now = new Date().toISOString();
  const payload: {
    status: PostStatus;
    published_at?: string | null;
    hidden_at?: string | null;
    deleted_at?: string | null;
    updated_at: string;
  } = {
    status,
    updated_at: now,
  };
  if (status === "published") {
    payload.published_at = before.published_at ?? now;
    payload.hidden_at = null;
    payload.deleted_at = null;
  }
  if (status === "hidden") {
    payload.hidden_at = now;
  }
  if (status === "deleted") {
    payload.deleted_at = now;
  }

  const { error } = await context.supabase.from("posts").update(payload).eq("id", id);
  if (error) return fail("帖子状态更新失败，请稍后再试。");

  const auditPayload = {
    old_status: before.status,
    new_status: status,
    post_type: before.post_type,
    title: before.title,
    author_id: before.author_id,
    metadata: {
      source: "admin_posts_management",
      status_changed_at: now,
    },
  };
  const audited = await writeAuditLog(context, auditActionForStatus(status), id, before, auditPayload);
  if (!audited) return fail("帖子状态已更新，但审计日志写入失败。");

  revalidatePost(before.post_type, id);
  return ok("帖子状态已更新。");
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isPostStatus(value: string): value is PostStatus {
  return value === "draft" || value === "pending_review" || value === "published" || value === "hidden" || value === "rejected" || value === "expired" || value === "deleted";
}

function auditActionForStatus(status: PostStatus) {
  if (status === "hidden") return "hide_post";
  if (status === "published") return "publish_post";
  if (status === "deleted") return "delete_post";
  if (status === "rejected") return "reject_post";
  if (status === "pending_review") return "mark_post_pending_review";
  return `set_post_${status}`;
}

function revalidatePost(type: PostType, id: string) {
  revalidatePath("/");
  revalidatePath(POST_TYPE_TO_ROUTE[type]);
  revalidatePath(postHref(type, id));
  revalidatePath("/admin/posts");
}
