import Link from "next/link";
import { notFound } from "next/navigation";
import { PostReportForm } from "@/components/reports/PostReportForm";
import { DEFAULT_CITY_SLUG, POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { PostType } from "@/features/posts/types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "举报此信息",
  description: "向 OpenAA 举报虚假、过期、联系方式异常或疑似违规的发布信息。",
  path: "/report",
  noIndex: true,
});

type ReportPagePost = {
  id: string;
  post_type: PostType;
  title: string;
};

export default async function ReportPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, account] = await Promise.all([readReportablePost(id), getReportAccountContext()]);

  if (!post) notFound();

  const href = `${POST_TYPE_TO_ROUTE[post.post_type]}/${post.id}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-3">
        <Link href={href} className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
          返回信息详情
        </Link>
      </div>
      <PostReportForm
        post={{
          id: post.id,
          title: post.title,
          typeLabel: POST_TYPE_LABELS[post.post_type],
          href,
        }}
        account={account}
      />
    </div>
  );
}

async function readReportablePost(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select("id,post_type,title,cities!inner(slug)")
    .eq("id", id)
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("cities.slug", DEFAULT_CITY_SLUG)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as ReportPagePost;
}

async function getReportAccountContext() {
  const empty = {
    isAuthenticated: false,
    hasAccountContact: false,
  };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return empty;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data } = await supabase
    .from("profiles")
    .select("email,phone,wechat_id,whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  return {
    isAuthenticated: true,
    hasAccountContact: Boolean(data?.email?.trim() || data?.phone?.trim() || data?.wechat_id?.trim() || data?.whatsapp?.trim()),
  };
}
