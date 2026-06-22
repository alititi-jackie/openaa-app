import { PostEditPage } from "@/components/posts/PostEditPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({ title: "编辑二手市场", path: "/secondhand/edit", noIndex: true });

export default async function SecondhandEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostEditPage id={id} postType="marketplace" returnTo={`/secondhand/edit/${id}`} />;
}
