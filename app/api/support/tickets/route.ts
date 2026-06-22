import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_SUPPORT_TICKET_SETTINGS, isSupportTicketType, type SupportTicketSettings } from "@/features/support/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedSources = new Set(["feedback_page", "news_detail", "post_detail", "profile_notifications"]);
const allowedTargetTypes = new Set(["", "post", "news", "navigation", "ad", "profile"]);

type ProfileContact = {
  email: string | null;
  phone: string | null;
  wechat_id: string | null;
  whatsapp: string | null;
};

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "请求参数无效。" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const type = readPayloadText(payload, "type");
  const relatedUrl = readPayloadText(payload, "related_url");
  const contactInfo = readPayloadText(payload, "contact_info");
  const content = readPayloadText(payload, "content");
  const visitorId = readPayloadText(payload, "visitor_id").slice(0, 120);
  const rawSource = readPayloadText(payload, "source").slice(0, 80) || "feedback_page";
  const rawTargetType = readPayloadText(payload, "target_type").slice(0, 80);
  const targetId = readPayloadText(payload, "target_id").slice(0, 200);
  const source = allowedSources.has(rawSource) ? rawSource : "feedback_page";
  const targetType = allowedTargetTypes.has(rawTargetType) ? rawTargetType : "";

  if (!isSupportTicketType(type)) {
    return NextResponse.json({ error: "请选择反馈类型。" }, { status: 400 });
  }
  if (rawTargetType && !allowedTargetTypes.has(rawTargetType)) {
    return NextResponse.json({ error: "请求参数无效。" }, { status: 400 });
  }
  if (targetId && !isSafeTargetId(targetId)) {
    return NextResponse.json({ error: "请求参数无效。" }, { status: 400 });
  }

  const serverClient = await createSupabaseServerClient();
  if (!serverClient) return NextResponse.json({ error: "线索与建议暂时无法提交，请稍后再试。" }, { status: 503 });

  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user && !visitorId) {
    return NextResponse.json({ error: "无法识别访客，请刷新页面后重试。" }, { status: 400 });
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: "线索与建议暂时无法提交，请稍后再试。" }, { status: 503 });
  }

  const settings = await readSupportTicketSettings(supabase);
  if (!settings.enabled) return NextResponse.json({ error: "线索与建议功能暂时关闭，请稍后再试。" }, { status: 503 });

  const profile = user ? await readProfileContact(supabase, user.id) : null;
  const hasAccountContact = Boolean(profile?.email?.trim() || profile?.phone?.trim() || profile?.wechat_id?.trim() || profile?.whatsapp?.trim());
  const contactRequired = !user || !hasAccountContact;

  const validationError = validatePayload({
    content,
    contactInfo,
    relatedUrl,
    contactRequired,
    settings,
  });
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { todayStartISO, tomorrowStartISO } = dayBounds();
  const { count: totalCount, error: totalError } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("created_at", todayStartISO)
    .lt("created_at", tomorrowStartISO);

  if (totalError) return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 500 });
  if ((totalCount ?? 0) >= settings.dailyTotalLimit) {
    return NextResponse.json({ error: "今日提交数量已达上限，请明天再试。" }, { status: 429 });
  }

  let actorQuery = supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("created_at", todayStartISO)
    .lt("created_at", tomorrowStartISO);

  actorQuery = user ? actorQuery.eq("user_id", user.id) : actorQuery.eq("visitor_id", visitorId);
  const { count: actorCount, error: actorError } = await actorQuery;
  if (actorError) return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 500 });

  const actorLimit = user ? settings.dailyUserLimit : settings.dailyVisitorLimit;
  if ((actorCount ?? 0) >= actorLimit) {
    return NextResponse.json({ error: "你今天提交的次数已达上限，请明天再试。" }, { status: 429 });
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user?.id ?? null,
      visitor_id: user ? null : visitorId,
      type,
      source,
      target_type: targetType || null,
      target_id: targetId || null,
      related_url: relatedUrl || null,
      contact_info: contactInfo || null,
      content,
      status: "new",
      priority: "normal",
    })
    .select("id,ticket_no")
    .single();

  if (error || !data) return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 500 });

  await supabase.from("support_ticket_events").insert({
    ticket_id: data.id,
    actor_id: user?.id ?? null,
    event_type: "create_feedback",
    before_data: null,
    after_data: {
      ticket_no: data.ticket_no,
      type,
      source,
      target_type: targetType || null,
      target_id: targetId || null,
    },
  });

  revalidatePath("/admin/messages");

  return NextResponse.json({ success: true, ticket_no: data.ticket_no }, { status: 201 });
}

async function readProfileContact(supabase: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data } = await supabase.from("profiles").select("email,phone,wechat_id,whatsapp").eq("id", userId).maybeSingle();
  return (data as ProfileContact | null) ?? null;
}

async function readSupportTicketSettings(supabase: ReturnType<typeof createSupabaseAdminClient>): Promise<SupportTicketSettings> {
  const { data } = await supabase.from("support_ticket_settings").select("key,value");
  const values = new Map((data ?? []).map((row: { key: string; value: string }) => [row.key, row.value]));
  return {
    enabled: parseBoolean(values.get("enabled"), DEFAULT_SUPPORT_TICKET_SETTINGS.enabled),
    dailyUserLimit: parseLimit(values.get("daily_user_limit"), DEFAULT_SUPPORT_TICKET_SETTINGS.dailyUserLimit, 1, 1000),
    dailyVisitorLimit: parseLimit(values.get("daily_visitor_limit"), DEFAULT_SUPPORT_TICKET_SETTINGS.dailyVisitorLimit, 1, 1000),
    dailyTotalLimit: parseLimit(values.get("daily_total_limit"), DEFAULT_SUPPORT_TICKET_SETTINGS.dailyTotalLimit, 1, 10000),
    contentMinLength: parseLimit(values.get("content_min_length"), DEFAULT_SUPPORT_TICKET_SETTINGS.contentMinLength, 1, 1000),
    contentMaxLength: parseLimit(values.get("content_max_length"), DEFAULT_SUPPORT_TICKET_SETTINGS.contentMaxLength, 10, 20000),
    contactMaxLength: parseLimit(values.get("contact_max_length"), DEFAULT_SUPPORT_TICKET_SETTINGS.contactMaxLength, 1, 1000),
    relatedUrlMaxLength: parseLimit(values.get("related_url_max_length"), DEFAULT_SUPPORT_TICKET_SETTINGS.relatedUrlMaxLength, 1, 2000),
  };
}

function validatePayload({
  content,
  contactInfo,
  relatedUrl,
  contactRequired,
  settings,
}: {
  content: string;
  contactInfo: string;
  relatedUrl: string;
  contactRequired: boolean;
  settings: SupportTicketSettings;
}) {
  if (!content) return "请填写内容。";
  if (content.length < settings.contentMinLength) return `内容至少需要 ${settings.contentMinLength} 个字。`;
  if (content.length > settings.contentMaxLength) return `内容不能超过 ${settings.contentMaxLength} 个字。`;
  if (contactRequired && !contactInfo) return "请填写联系方式，方便我们核实和回复。";
  if (contactInfo.length > settings.contactMaxLength) return `联系方式不能超过 ${settings.contactMaxLength} 个字。`;
  if (relatedUrl.length > settings.relatedUrlMaxLength) return `相关链接不能超过 ${settings.relatedUrlMaxLength} 个字。`;
  if (relatedUrl && !isValidUrl(relatedUrl)) return "相关链接格式不正确，请输入完整 URL。";
  return null;
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

function isSafeTargetId(value: string) {
  return /^[a-zA-Z0-9:_./-]{1,200}$/.test(value);
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseLimit(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function readPayloadText(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}
