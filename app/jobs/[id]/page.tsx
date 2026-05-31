import { PostDetailView } from "@/components/posts/PostDetailView";
import { getPublicPostById } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "招聘详情",
  description: "OpenAA 纽约华人招聘详情。",
  path: "/jobs",
});

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPublicPostById(id, "job");

  return <PostDetailView post={post.data} />;
}
