import "server-only";

import { hasAdminModule } from "@/lib/permissions/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type MessageCenterPendingCounts = {
  reports: number;
  feedback: number;
};

export async function getMessageCenterPendingCounts(): Promise<MessageCenterPendingCounts | null> {
  if (!(await hasAdminModule("messages"))) return null;

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return null;
  }

  const [reports, feedback] = await Promise.all([
    supabase
      .from("post_reports")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["open", "in_review"]),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "new"),
  ]);

  return {
    reports: reports.count ?? 0,
    feedback: feedback.count ?? 0,
  };
}
