import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessProfile, Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "编辑资料",
  description: "编辑 OpenAA 用户资料。",
  path: "/profile/edit",
  noIndex: true,
});

export default async function ProfileEditPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <PageShell
        title="编辑资料"
        description="Supabase 环境变量尚未配置。配置新 Supabase 后，这里会保存当前用户资料。"
        eyebrow="Profile"
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnTo=/profile/edit");
  }

  const profile = (await ensureProfileForUser(user)) as Profile;
  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <PageShell title="编辑资料" description="只更新当前登录用户自己的资料。" eyebrow="Profile">
      <ProfileEditForm
        userId={user.id}
        initialProfile={profile}
        initialBusinessProfile={(businessProfile as BusinessProfile | null) ?? null}
      />
    </PageShell>
  );
}
