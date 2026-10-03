import { NextResponse } from "next/server";
import { checkAdminRateLimit, readClientIp } from "@/lib/rateLimit/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  agentDimensions,
  normalizeAnalyticsPath,
  normalizeId,
  referrerHost,
  siteFromOrigin,
} from "@/features/analytics/shared";

const ANALYTICS_IP_PATH_WINDOW_MS = 5 * 60 * 1000;
const ANALYTICS_IP_PATH_LIMIT = 120;

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  return siteFromOrigin(origin)
    ? {
        "Access-Control-Allow-Origin": origin!,
        Vary: "Origin",
        "Cache-Control": "no-store",
      }
    : { Vary: "Origin", "Cache-Control": "no-store" };
}
export function OPTIONS(request: Request) {
  if (!siteFromOrigin(request.headers.get("origin")))
    return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...cors(request),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
    },
  });
}
export async function POST(request: Request) {
  const reply = (body: object, status = 200) =>
    NextResponse.json(body, { status, headers: cors(request) });
  const site = siteFromOrigin(request.headers.get("origin"));
  if (!site) return reply({ ok: false, message: "invalid_origin" }, 403);
  // Never collect preview deployments in production analytics.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production")
    return reply({ ok: true, skipped: true });
  let payload: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply({ ok: false }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return reply({ ok: false, message: "too_large" }, 413);
      }
      chunks.push(value);
    }
    payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return reply({ ok: false }, 400);
  } catch {
    return reply({ ok: false, message: "invalid_payload" }, 400);
  }
  const path = normalizeAnalyticsPath(payload.path);
  if (!path) return reply({ ok: true, skipped: true });
  const ua = (request.headers.get("user-agent") ?? "").slice(0, 500);
  if (!ua || /bot|crawler|spider|headless|lighthouse|preview/i.test(ua))
    return reply({ ok: true, skipped: true });
  const visitorId = normalizeId(payload.visitor_id);
  if (!visitorId) return reply({ ok: false, message: "missing_actor" }, 400);
  if (!(await allowPageViewRecord(request, `${site}:${path}`)))
    return reply({ ok: true, skipped: true });
  try {
    // Subsites use anonymous, credential-free collection; never accept a client user_id.
    const supabase =
      site === "openaa" ? await createSupabaseServerClient() : null;
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    const admin = createSupabaseAdminClient();
    const eventId =
      typeof payload.event_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        payload.event_id,
      )
        ? payload.event_id
        : null;
    const country =
      process.env.VERCEL === "1"
        ? request.headers.get("x-vercel-ip-country")
        : null;
    const region = country
      ? request.headers.get("x-vercel-ip-country-region")
      : null;
    const { error } = await admin.from("site_page_views").insert({
      site,
      path,
      title:
        typeof payload.title === "string" ? payload.title.slice(0, 180) : null,
      user_id: user?.id ?? null,
      visitor_id: visitorId,
      event_id: eventId,
      referrer: referrerHost(payload.referrer),
      user_agent: ua,
      ...agentDimensions(ua),
      country: country && /^[A-Z]{2}$/.test(country) ? country : null,
      region: region?.slice(0, 80) ?? null,
      metadata: {},
    });
    if (error && error.code !== "23505") {
      console.error("[analytics] insert failed", { code: error.code });
      return reply({ ok: false, message: "insert_failed" }, 500);
    }
    return reply({ ok: true });
  } catch {
    return reply({ ok: false, message: "missing_config" }, 503);
  }
}

async function allowPageViewRecord(request: Request, path: string) {
  try {
    const clientIp = readClientIp(request);
    const actorId = `${clientIp}:${path}`.slice(0, 500);
    const result = await checkAdminRateLimit({
      actorId,
      action: "analytics_page_view_ip_path",
      limit: ANALYTICS_IP_PATH_LIMIT,
      windowMs: ANALYTICS_IP_PATH_WINDOW_MS,
      metadata: { source: "analytics_page_view" },
    });

    if (!result.allowed) return false;
    const globalResult = await checkAdminRateLimit({
      actorId: clientIp,
      action: "analytics_page_view_ip_global",
      limit: 300,
      windowMs: ANALYTICS_IP_PATH_WINDOW_MS,
    });
    return globalResult.allowed;
  } catch {
    return false;
  }
}
