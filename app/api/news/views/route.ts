import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import {
  readNewsViewCounts,
  readNewsViewSettings,
} from "@/features/news/viewQueries";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const reply = (body: object, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  const params = new URL(request.url).searchParams;
  const scope = params.get("scope");
  const ids = [...new Set((params.get("ids") ?? "").split(","))];
  if (
    (scope !== "detail" && scope !== "list") ||
    ids.length > 100 ||
    !ids.every((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      ),
    )
  )
    return reply({ enabled: false }, 400);
  const config = await readNewsViewSettings();
  if (!config.ok) return reply({ enabled: false }, 503);
  if (!config.settings[scope]) return reply({ enabled: false });
  const client = createSupabasePublicClient({ cache: "no-store" });
  if (!client) return reply({ enabled: false }, 503);
  const { data, error } = await client
    .from("news_posts")
    .select("id")
    .in("id", ids)
    .eq("status", "published")
    .is("deleted_at", null)
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`);
  if (error) return reply({ enabled: false }, 503);
  const counts = await readNewsViewCounts(
    (data ?? []).map((row) => String(row.id)),
    client,
  );
  return reply({ enabled: true, counts });
}
