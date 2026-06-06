import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues, publishContactDefaultsFromProfile } from "@/features/posts/formMappers";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布二手",
  description: "发布纽约二手出售或求购信息。",
  path: "/marketplace/publish",
  noIndex: true,
});

export default async function MarketplacePublishPage() {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/marketplace/publish");
  const profile = await ensureProfileForUser(user);

  return <PostForm mode="create" postType="marketplace" initialValues={emptyPostFormValues("marketplace", publishContactDefaultsFromProfile(profile))} />;
}
