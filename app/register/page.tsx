import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "注册",
  description: "注册 OpenAA 账号。",
  path: "/register",
  noIndex: true,
});

type RegisterPageProps = {
  searchParams: Promise<{ agreed?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/profile");
    }
  }

  return (
    <Suspense>
      <RegisterForm initialAccepted={params.agreed === "1"} />
    </Suspense>
  );
}
