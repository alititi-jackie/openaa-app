import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthRequiredSessionRedirect } from "@/components/auth/AuthRequiredSessionRedirect";
import { BackButton } from "@/components/common/BackButton";
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

const secondaryButtonClassName =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50";

export default async function AuthRequiredPage({ searchParams }: AuthRequiredPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const encodedReturnTo = encodeURIComponent(returnTo);
  const user = await getCurrentUser();

  if (user) {
    redirect(returnTo);
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-10">
      <Suspense fallback={null}>
        <AuthRequiredSessionRedirect />
      </Suspense>
      <section className="w-full max-w-[340px] bg-white text-center">
        <h1 className="text-2xl font-black text-slate-950">请先登录或注册 OpenAA</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">登录后可以发布信息、管理自己的内容、收藏帖子，并在不同设备继续使用 OpenAA。</p>
        <div className="mt-6 grid gap-3">
          <Link
            href={`/login?returnTo=${encodedReturnTo}`}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
          >
            登录
          </Link>
          <Link href={`/register?returnTo=${encodedReturnTo}`} className={secondaryButtonClassName}>
            注册
          </Link>
          <BackButton label="返回" className={secondaryButtonClassName} />
        </div>
      </section>
    </div>
  );
}
