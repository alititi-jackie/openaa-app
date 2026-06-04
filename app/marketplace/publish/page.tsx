import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues } from "@/features/posts/formMappers";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布二手市场",
  description: "发布纽约二手出售或求购信息。",
  path: "/marketplace/publish",
  noIndex: true,
});

export default async function MarketplacePublishPage() {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/marketplace/publish");

  return <PostForm mode="create" postType="marketplace" initialValues={emptyPostFormValues("marketplace")} />;
}
