import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeFeedbackType } from "@/features/feedback/types";

export const dynamic = "force-dynamic";

const DEFAULT_USER_DAILY_LIMIT = 5;
const DEFAULT_TOTAL_DAILY_LIMIT = 100;
const USER_LIMIT_MESSAGE = "你今天提交反馈的次数已达上限，请明天再试。如有紧急问题，请邮件联系：323748@gmail.com";
const TOTAL_LIMIT_MESSAGE = "今日反馈提交数量已达上限，请明天再试。如有紧急问题，请邮件联系：323748@gmail.com";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "请求参数无效" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const type = readPayloadText(payload, "type");
  const relatedUrl = readPayloadText(payload, "related_url");
  const contact = readPayloadText(payload, "contact");
  const content = readPayloadText(payload, "content");
  const visitorId = readPayloadText(payload, "visitor_id").slice(0, 120);

  if (!type) return NextResponse.json({ error: "请选择反馈类型。" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "请填写反馈内容。" }, { status: 400 });
  if (relatedUrl && !isValidUrl(relatedUrl)) {
    return NextResponse.json({ error: "相关链接格式不正确，请输入完整 URL。" }, { status: 400 });
  }

  const serverClient = await createSupabaseServerClient();
  if (!serverClient) return NextResponse.json({ error: "反馈暂时无法提交，请稍后再试。" }, { status: 503 });

  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user && !visitorId) return NextResponse.json({ error: "无法识别访客，请刷新页面后重试。" }, { status: 400 });

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "反馈暂时无法提交，请稍后再试。" }, { status: 503 });
  }

  const { userDailyLimit, totalDailyLimit } = await readFeedbackSettings(supabase);
  const { todayStartISO, tomorrowStartISO } = dayBounds();

  const { count: totalCount, error: totalError } = await supabase
    .from("feedback_posts")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("created_at", todayStartISO)
    .lt("created_at", tomorrowStartISO);

  if (totalError) return NextResponse.json({ error: "反馈提交失败，请稍后再试。" }, { status: 500 });
  if ((totalCount ?? 0) >= totalDailyLimit) return NextResponse.json({ error: TOTAL_LIMIT_MESSAGE }, { status: 429 });

  let actorQuery = supabase
    .from("feedback_posts")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("created_at", todayStartISO)
    .lt("created_at", tomorrowStartISO);

  actorQuery = user ? actorQuery.eq("user_id", user.id) : actorQuery.eq("visitor_id", visitorId);

  const { count: actorCount, error: actorError } = await actorQuery;
  if (actorError) return NextResponse.json({ error: "反馈提交失败，请稍后再试。" }, { status: 500 });
  if ((actorCount ?? 0) >= userDailyLimit) return NextResponse.json({ error: USER_LIMIT_MESSAGE }, { status: 429 });

  const { error } = await supabase.from("feedback_posts").insert({
    user_id: user?.id ?? null,
    visitor_id: user ? null : visitorId,
    type: normalizeFeedbackType(type),
    related_url: relatedUrl || null,
    contact: contact || null,
    content,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: "反馈提交失败，请稍后再试。" }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 201 });
}

async function readFeedbackSettings(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await supabase.from("feedback_settings").select("key,value").in("key", ["feedback_daily_user_limit", "feedback_daily_total_limit"]);
  const rows = (data ?? []) as Array<{ key: string; value: number | null }>;
  return {
    userDailyLimit: normalizeLimit(rows.find((row) => row.key === "feedback_daily_user_limit")?.value, DEFAULT_USER_DAILY_LIMIT),
    totalDailyLimit: normalizeLimit(rows.find((row) => row.key === "feedback_daily_total_limit")?.value, DEFAULT_TOTAL_DAILY_LIMIT),
  };
}

function normalizeLimit(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 1000 ? parsed : fallback;
}

function dayBounds() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  return {
    todayStartISO: todayStart.toISOString(),
    tomorrowStartISO: tomorrowStart.toISOString(),
  };
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function readPayloadText(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}
