import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
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
  searchParams: Promise<{ returnTo?: string }>;
};

function safeReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/profile";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(safeReturnTo(params.returnTo));
    }
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
