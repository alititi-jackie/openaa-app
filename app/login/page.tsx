import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeReturnTo } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "登录",
  description: "登录 OpenAA 账号。",
  path: "/login",
  noIndex: true,
});

type LoginPageProps = {
  searchParams: Promise<{ returnTo?: string; source?: string; message?: string; autoRedirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const shouldShowLoginSuccess = params.source === "login" && params.message === "登录成功";
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && !shouldShowLoginSuccess) {
      redirect(safeReturnTo(params.returnTo));
    }
  }

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-8rem)] items-center justify-center bg-zinc-100 px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
