import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues } from "@/features/posts/formMappers";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
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

  return <PostForm mode="create" postType="housing" initialValues={emptyPostFormValues("housing")} />;
}
