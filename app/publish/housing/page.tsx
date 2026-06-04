import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues } from "@/features/posts/formMappers";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布房屋",
  description: "发布纽约租房、求租、合租或房屋信息。",
  path: "/publish/housing",
  noIndex: true,
});

export default async function PublishHousingAliasPage({ searchParams }: { searchParams?: Promise<{ type?: string; mode?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/publish/housing");

  const params = (await searchParams) ?? {};
  const initialValues = emptyPostFormValues("housing");
  if (params.type === "seeking" || params.mode === "seeking") {
    initialValues.housing!.housing_mode = "seeking";
  }

  return <PostForm mode="create" postType="housing" initialValues={initialValues} legacyParity />;
}
