import { Suspense } from "react";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = buildPageMetadata({
  title: "线索与建议",
  description: "向 OpenAA 提交新闻线索、合作咨询、功能建议或回复管理员。",
  path: "/feedback",
  noIndex: true,
});

export default async function FeedbackPage() {
  const account = await getFeedbackAccountContext();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">加载中...</div>}>
          <FeedbackForm account={account} />
        </Suspense>
      </div>
    </div>
  );
}

async function getFeedbackAccountContext() {
  const empty = {
    isAuthenticated: false,
    hasAccountContact: false,
    profile: null,
  };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return empty;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data } = await supabase
    .from("profiles")
    .select("nickname,email,phone,wechat_id,whatsapp,preferred_contact_method")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data
    ? {
        userId: user.id,
        nickname: typeof data.nickname === "string" ? data.nickname : null,
        email: typeof data.email === "string" ? data.email : null,
        phone: typeof data.phone === "string" ? data.phone : null,
        wechatId: typeof data.wechat_id === "string" ? data.wechat_id : null,
        whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : null,
        preferredContactMethod: typeof data.preferred_contact_method === "string" ? data.preferred_contact_method : null,
      }
    : {
        userId: user.id,
        nickname: null,
        email: null,
        phone: null,
        wechatId: null,
        whatsapp: null,
        preferredContactMethod: null,
      };

  return {
    isAuthenticated: true,
    hasAccountContact: Boolean(profile.email?.trim() || profile.phone?.trim() || profile.wechatId?.trim() || profile.whatsapp?.trim()),
    profile,
  };
}
