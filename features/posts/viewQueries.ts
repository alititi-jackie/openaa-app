import "server-only";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  POST_VIEW_SETTING_KEY,
  normalizePostViewSettings,
} from "./viewSettings";

type Client = NonNullable<
  Awaited<ReturnType<typeof createSupabaseServerClient>>
>;
export async function readPostViewSettings(client?: Client) {
  const supabase = client ?? createSupabasePublicClient({ cache: "no-store" });
  if (!supabase)
    return { ok: false, settings: normalizePostViewSettings(null) };
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", POST_VIEW_SETTING_KEY)
      .maybeSingle();
    return {
      ok: !error && Boolean(data),
      settings: normalizePostViewSettings(error ? null : data?.value),
    };
  } catch {
    return { ok: false, settings: normalizePostViewSettings(null) };
  }
}
