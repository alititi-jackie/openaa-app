import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasAdminModule } from "@/lib/permissions/admin";
import { SUPPORT_TICKET_TYPE_LABELS, type SupportTicketType } from "@/features/support/types";
import { REPORT_REASON_LABELS, type ReportReason } from "@/features/reports/types";

export type MessageRecycleType = "reports" | "feedback";

export type MessageRecycleItem = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  deletedAt: string | null;
  createdAt: string;
};

export type MessageRecycleData = {
  state: "ready" | "missing_config" | "forbidden" | "error";
  error?: string;
  type: MessageRecycleType;
  items: MessageRecycleItem[];
};

type DeletedReportRow = {
  id: string;
  reason: string | null;
  detail: string | null;
  created_at: string;
  deleted_at: string | null;
  posts?: { title: string | null; post_type: string | null }[] | { title: string | null; post_type: string | null } | null;
};

type DeletedFeedbackRow = {
  id: string;
  ticket_no: string | null;
  type: string | null;
  content: string | null;
  created_at: string;
  deleted_at: string | null;
};

export async function getMessageRecycleData(type: MessageRecycleType): Promise<MessageRecycleData> {
  if (!(await hasAdminModule("recycle-bin"))) return { state: "forbidden", type, items: [] };

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return { state: "missing_config", type, items: [], error: "Supabase service role 环境变量未配置。" };
  }

  if (type === "feedback") return readDeletedFeedback(supabase);
  return readDeletedReports(supabase);
}

async function readDeletedReports(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<MessageRecycleData> {
  const { data, error } = await supabase
    .from("post_reports")
    .select("id,reason,detail,created_at,deleted_at,posts(title,post_type)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(100);

  if (error) return { state: "error", type: "reports", items: [], error: "已删除举报读取失败。" };

  return {
    state: "ready",
    type: "reports",
    items: ((data ?? []) as DeletedReportRow[]).map((row) => {
      const post = Array.isArray(row.posts) ? row.posts[0] : row.posts;
      const reason = normalizeReportReason(String(row.reason ?? ""));
      return {
        id: String(row.id),
        title: post?.title || "信息已不存在",
        subtitle: `举报原因：${REPORT_REASON_LABELS[reason]}`,
        content: row.detail || "未填写详细说明。",
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
      };
    }),
  };
}

async function readDeletedFeedback(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<MessageRecycleData> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id,ticket_no,type,content,created_at,deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(100);

  if (error) return { state: "error", type: "feedback", items: [], error: "已删除线索与建议读取失败。" };

  return {
    state: "ready",
    type: "feedback",
    items: ((data ?? []) as DeletedFeedbackRow[]).map((row) => {
      const type = normalizeFeedbackType(String(row.type ?? ""));
      return {
        id: String(row.id),
        title: row.ticket_no ? `编号 ${row.ticket_no}` : "线索与建议",
        subtitle: SUPPORT_TICKET_TYPE_LABELS[type],
        content: row.content || "",
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
      };
    }),
  };
}

function normalizeReportReason(value: string): ReportReason {
  if (value === "false_information" || value === "invalid_contact" || value === "scam" || value === "expired" || value === "illegal" || value === "other") return value;
  return "other";
}

function normalizeFeedbackType(value: string): SupportTicketType {
  if (value === "business" || value === "news_tip" || value === "feature_suggestion" || value === "other" || value === "admin_reply") return value;
  return "other";
}
