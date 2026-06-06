import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues, publishContactDefaultsFromProfile } from "@/features/posts/formMappers";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布房屋",
  description: "发布纽约租房、求租、合租或房屋信息。",
  path: "/housing/publish",
  noIndex: true,
});

export default async function HousingPublishPage() {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/housing/publish");
  const profile = await ensureProfileForUser(user);

  return <PostForm mode="create" postType="housing" initialValues={emptyPostFormValues("housing", publishContactDefaultsFromProfile(profile))} />;
}
