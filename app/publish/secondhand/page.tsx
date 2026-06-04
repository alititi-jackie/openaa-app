import { PostForm } from "@/components/forms/PostForm";
import { emptyPostFormValues } from "@/features/posts/formMappers";
import { normalizeSecondhandMode } from "@/features/secondhand/legacy";
import { redirectToAuthRequired } from "@/lib/auth/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "发布二手",
  description: "发布纽约二手出售或求购信息。",
  path: "/publish/secondhand",
  noIndex: true,
});

export default async function PublishSecondhandAliasPage({ searchParams }: { searchParams?: Promise<{ type?: string; mode?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirectToAuthRequired("/publish/secondhand");

  const params = (await searchParams) ?? {};
  const initialValues = emptyPostFormValues("marketplace");
  initialValues.marketplace!.marketplace_mode = normalizeSecondhandMode(params.type ?? params.mode);

  return <PostForm mode="create" postType="marketplace" initialValues={initialValues} legacyParity />;
}
