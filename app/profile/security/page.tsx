import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ProfileSecurityForm } from "@/components/profile/ProfileSecurityForm";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Account security",
  description: "Manage OpenAA account password.",
  path: "/profile/security",
  noIndex: true,
});

export default async function ProfileSecurityPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <PageShell
        title="Account security"
        description="Supabase is not configured yet. Password changes will be available after the new Supabase project is configured."
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
    <PageShell title="Account security" description="Update the password for your OpenAA account." eyebrow="Profile">
      <ProfileSecurityForm />
    </PageShell>
  );
}
