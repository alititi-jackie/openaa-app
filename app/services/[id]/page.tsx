import { PostDetailView } from "@/components/posts/PostDetailView";
import { getPublicPostById } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "本地服务详情",
  description: "OpenAA 纽约本地服务详情。",
  path: "/services",
});

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPublicPostById(id, "service");

  return <PostDetailView post={post.data} />;
}
