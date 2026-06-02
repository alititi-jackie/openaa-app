import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type NotificationsQueryResult = {
  state: "ready" | "missing_config" | "error";
  data: NotificationListItem[];
  error?: string;
};

export async function getMyNotifications(limit = 50): Promise<NotificationsQueryResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { state: "missing_config", data: [] };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { state: "ready", data: [] };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id,type,title,body,link_url,data,read_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { state: "error", data: [], error: error.message };
  }

  return { state: "ready", data: (data ?? []) as NotificationListItem[] };
}
