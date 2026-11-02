import "server-only";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  NEWS_VIEW_SETTING_KEY,
  normalizeNewsViewSettings,
} from "./viewSettings";

type Client = NonNullable<
  Awaited<ReturnType<typeof createSupabaseServerClient>>
>;
export async function readNewsViewSettings(client?: Client) {
  const supabase = client ?? createSupabasePublicClient({ cache: "no-store" });
  if (!supabase)
    return { ok: false, settings: normalizeNewsViewSettings(null) };
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", NEWS_VIEW_SETTING_KEY)
      .maybeSingle();
    return {
      ok: !error && Boolean(data),
      settings: normalizeNewsViewSettings(error ? null : data?.value),
    };
  } catch {
    return { ok: false, settings: normalizeNewsViewSettings(null) };
  }
}
export async function readNewsViewCounts(
  ids: string[],
  client: Client,
): Promise<Record<string, number | null>> {
  if (!ids.length) return {};
  try {
    const { data, error } = await client
      .from("news_stats")
      .select("news_id,view_count")
      .in("news_id", ids);
    if (error) return Object.fromEntries(ids.map((id) => [id, null]));
    const counts = new Map(
      (data ?? []).map((row) => [String(row.news_id), Number(row.view_count)]),
    );
    return Object.fromEntries(ids.map((id) => [id, counts.get(id) ?? 0]));
  } catch {
    return Object.fromEntries(ids.map((id) => [id, null]));
  }
}
