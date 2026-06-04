import { PageShell } from "@/components/layout/PageShell";
import { ProfileSecurityForm } from "@/components/profile/ProfileSecurityForm";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "修改密码",
  description: "修改 OpenAA 账号密码。",
  path: "/profile/security",
  noIndex: true,
});

export default async function ProfileSecurityPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <PageShell
        title="修改密码"
        description="Supabase 环境变量尚未配置。配置新 Supabase 后即可修改密码。"
        eyebrow="Profile"
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirectToAuthRequired("/profile/security");
  }

  try {
    await ensureProfileForUser(user);
  } catch (error) {
    console.error("[profile/security] ensureProfileForUser failed", error);
    return (
      <PageShell
        title="修改密码"
        description="登录成功，资料正在补全中。请稍后刷新再试。"
        eyebrow="Profile"
      />
    );
  }

  return (
    <PageShell title="修改密码" description="请输入原密码和新密码。修改成功后，请使用新密码重新登录。" eyebrow="Profile">
      <ProfileSecurityForm email={user.email ?? null} />
    </PageShell>
  );
}
