import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthRequiredSessionRedirect } from "@/components/auth/AuthRequiredSessionRedirect";
import { PageShell } from "@/components/layout/PageShell";
import { safeReturnTo } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata = buildPageMetadata({
  title: "请先登录或注册 OpenAA",
  description: "登录或注册 OpenAA 后继续访问需要账号的功能。",
  path: "/auth-required",
  noIndex: true,
});

type AuthRequiredPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function AuthRequiredPage({ searchParams }: AuthRequiredPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const encodedReturnTo = encodeURIComponent(returnTo);
  const user = await getCurrentUser();

  if (user) {
    redirect(returnTo);
  }

  return (
    <PageShell
      title="请先登录或注册 OpenAA"
      description="登录后可以发布信息、管理自己的内容、收藏帖子，并在不同设备继续使用 OpenAA。"
      eyebrow="Account"
    >
      <Suspense fallback={null}>
        <AuthRequiredSessionRedirect />
      </Suspense>
      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 pb-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/login?returnTo=${encodedReturnTo}`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            登录
          </Link>
          <Link href={`/register?returnTo=${encodedReturnTo}`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
            注册
          </Link>
          <Link href="/profile" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
            返回我的页面
          </Link>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
            返回首页
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
