import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_CITY_SLUG, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { PostType } from "@/features/posts/types";
import { isReportReason } from "@/features/reports/types";

export const dynamic = "force-dynamic";

type ProfileContact = {
  email: string | null;
  phone: string | null;
  wechat_id: string | null;
  whatsapp: string | null;
};

type PublicPost = {
  id: string;
  post_type: PostType;
  title: string;
  author_id: string | null;
  status: string;
  visibility: string;
  expires_at: string | null;
  cities?: { slug: string }[] | { slug: string } | null;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "请求参数无效。" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const postId = readText(payload, "post_id");
  const reason = readText(payload, "reason");
  const detail = readText(payload, "detail");
  const contactInfo = readText(payload, "contact_info");
  const visitorId = readText(payload, "visitor_id").slice(0, 120);
  const relatedUrl = readText(payload, "related_url").slice(0, 500);

  if (!postId) return NextResponse.json({ error: "缺少被举报信息。" }, { status: 400 });
  if (!isReportReason(reason)) return NextResponse.json({ error: "请选择有效的举报原因。" }, { status: 400 });
  if (detail.length < 10) return NextResponse.json({ error: "举报内容至少需要 10 个字。" }, { status: 400 });
  if (detail.length > 1000) return NextResponse.json({ error: "举报内容不能超过 1000 个字。" }, { status: 400 });
  if (contactInfo.length > 200) return NextResponse.json({ error: "联系方式不能超过 200 个字。" }, { status: 400 });
  if (relatedUrl && !isValidUrl(relatedUrl)) return NextResponse.json({ error: "相关链接格式不正确。" }, { status: 400 });

  const serverClient = await createSupabaseServerClient();
  if (!serverClient) return NextResponse.json({ error: "举报暂时无法提交，请稍后再试。" }, { status: 503 });

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
    return NextResponse.json({ error: "举报暂时无法提交，请稍后再试。" }, { status: 503 });
  }

  const post = await readPublicPost(supabase, postId);
  if (!post) return NextResponse.json({ error: "这条信息当前不可举报。" }, { status: 404 });
  if (user && post.author_id === user.id) return NextResponse.json({ error: "不能举报自己发布的信息。" }, { status: 400 });

  const profile = user ? await readProfileContact(supabase, user.id) : null;
  const hasAccountContact = Boolean(
    profile?.email?.trim() || profile?.phone?.trim() || profile?.wechat_id?.trim() || profile?.whatsapp?.trim(),
  );
  if ((!user || !hasAccountContact) && !contactInfo) {
    return NextResponse.json({ error: "请填写联系方式，方便平台核实举报内容。" }, { status: 400 });
  }

  let duplicateQuery = supabase
    .from("post_reports")
    .select("id")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .in("status", ["open", "in_review"])
    .limit(1);

  duplicateQuery = user ? duplicateQuery.eq("reporter_id", user.id) : duplicateQuery.eq("visitor_id", visitorId);
  const { data: existing, error: existingError } = await duplicateQuery.maybeSingle();
  if (existingError) return NextResponse.json({ error: "举报状态读取失败，请稍后再试。" }, { status: 500 });
  if (existing?.id) return NextResponse.json({ error: "你已经举报过这条信息，我们会尽快处理。" }, { status: 409 });

  const { error } = await supabase.from("post_reports").insert({
    post_id: postId,
    reporter_id: user?.id ?? null,
    visitor_id: user ? null : visitorId,
    contact_info: contactInfo || null,
    related_url: relatedUrl || null,
    reason,
    detail,
    status: "open",
  });

  if (error) return NextResponse.json({ error: "举报提交失败，请稍后再试。" }, { status: 500 });

  revalidatePath(POST_TYPE_TO_ROUTE[post.post_type]);
  revalidatePath(`${POST_TYPE_TO_ROUTE[post.post_type]}/${post.id}`);
  revalidatePath("/admin/messages");

  return NextResponse.json({ success: true }, { status: 201 });
}

async function readPublicPost(supabase: ReturnType<typeof createSupabaseAdminClient>, postId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select("id,post_type,title,author_id,status,visibility,expires_at,cities!inner(slug)")
    .eq("id", postId)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("cities.slug", DEFAULT_CITY_SLUG)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as PublicPost;
}

async function readProfileContact(supabase: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("email,phone,wechat_id,whatsapp")
    .eq("id", userId)
    .maybeSingle();
  return (data as ProfileContact | null) ?? null;
}

function readText(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
