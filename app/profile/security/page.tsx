import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ProfileSecurityForm } from "@/components/profile/ProfileSecurityForm";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "账号安全",
  description: "管理 OpenAA 账号密码。",
  path: "/profile/security",
  noIndex: true,
});

export default async function ProfileSecurityPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <PageShell
        title="账号安全"
        description="Supabase 环境变量尚未配置。配置新 Supabase 后即可修改或设置邮箱登录密码。"
        eyebrow="Profile"
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnTo=/profile/security");
  }

  await ensureProfileForUser(user);

  return (
    <PageShell title="账号安全" description="修改或设置你的 OpenAA 邮箱登录密码。" eyebrow="Profile">
      <ProfileSecurityForm />
    </PageShell>
  );
}
