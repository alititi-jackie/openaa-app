import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "登录回调",
  description: "OpenAA Auth callback.",
  path: "/auth/callback",
  noIndex: true,
});

type AuthCallbackPageProps = {
  searchParams: Promise<{
    code?: string;
    returnTo?: string;
    error_description?: string;
  }>;
};

function safeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/profile";
  }

  return value;
}

export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <PageShell
        title="登录回调"
        description="Supabase 环境变量尚未配置。配置新 Supabase 后，此页面会处理 OAuth、邮箱验证和密码重置回调。"
        eyebrow="Auth"
      />
    );
  }

  if (params.error_description) {
    return <PageShell title="登录失败" description={params.error_description} eyebrow="Auth" />;
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (error) {
      return <PageShell title="登录失败" description="登录链接已失效或无法完成会话交换，请重新登录。" eyebrow="Auth" />;
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfileForUser(user);
  redirect(safeReturnTo(params.returnTo));
}
