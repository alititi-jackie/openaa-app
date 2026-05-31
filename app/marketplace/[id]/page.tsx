import { PostDetailView } from "@/components/posts/PostDetailView";
import { getPublicPostById } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "二手市场详情",
  description: "OpenAA 纽约二手市场详情。",
  path: "/marketplace",
});

export const dynamic = "force-dynamic";

export default async function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPublicPostById(id, "marketplace");

  return <PostDetailView post={post.data} />;
}
