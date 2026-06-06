import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues, publishContactDefaultsFromProfile } from "@/features/posts/formMappers";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布本地服务",
  description: "发布纽约本地服务信息。",
  path: "/services/publish",
  noIndex: true,
});

export default async function ServicesPublishPage() {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/services/publish");
  const profile = await ensureProfileForUser(user);

  return <PostForm mode="create" postType="service" initialValues={emptyPostFormValues("service", publishContactDefaultsFromProfile(profile))} />;
}
