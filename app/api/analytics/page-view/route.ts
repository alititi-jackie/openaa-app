import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { checkAdminRateLimit, readClientIp } from "@/lib/rateLimit/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_TEXT_LENGTH = 500;
const ANALYTICS_IP_PATH_WINDOW_MS = 5 * 60 * 1000;
const ANALYTICS_IP_PATH_LIMIT = 120;

type PageViewPayload = {
  path?: unknown;
  title?: unknown;
  visitor_id?: unknown;
  referrer?: unknown;
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, message: "missing_config" }, { status: 503 });

  let payload: PageViewPayload;
  try {
    payload = (await request.json()) as PageViewPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "invalid_payload" }, { status: 400 });
  }

  const path = normalizePath(payload.path);
  if (!path || shouldSkipPath(path)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const visitorId = user ? null : normalizeText(payload.visitor_id, 120);
  if (!user && !visitorId) {
    return NextResponse.json({ ok: false, message: "missing_actor" }, { status: 400 });
  }

  const headerStore = await headers();
  const userAgent = normalizeText(headerStore.get("user-agent"), MAX_TEXT_LENGTH);
  if (!userAgent || /bot|crawler|spider|headless|lighthouse|preview/i.test(userAgent)) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const referrer = normalizeText(payload.referrer, MAX_TEXT_LENGTH) ?? normalizeText(headerStore.get("referer"), MAX_TEXT_LENGTH);
  const allowed = await allowPageViewRecord(request, path);

  if (!allowed) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let adminClient: ReturnType<typeof createSupabaseAdminClient>;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, message: "missing_config" }, { status: 503 });
  }
  const { error } = await adminClient.from("site_page_views").insert({
    path,
    title: normalizeText(payload.title, 180),
    user_id: user?.id ?? null,
    visitor_id: visitorId,
    referrer,
    user_agent: userAgent,
    device_type: deviceTypeFromUserAgent(userAgent),
    metadata: {},
  });

  if (error) {
    console.error("[analytics] page view insert failed", { path, error });
    return NextResponse.json({ ok: false, message: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
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

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

function normalizePath(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;

  try {
    const url = new URL(trimmed, "https://openaa.local");
    return url.pathname.replace(/\/{2,}/g, "/") || "/";
  } catch {
    return null;
  }
}

function shouldSkipPath(path: string) {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path === "/manifest.webmanifest"
  );
}

function deviceTypeFromUserAgent(userAgent: string | null) {
  const value = userAgent?.toLowerCase() ?? "";
  if (!value) return null;
  if (value.includes("ipad") || value.includes("tablet")) return "tablet";
  if (value.includes("mobile") || value.includes("iphone") || value.includes("android")) return "mobile";
  return "desktop";
}
