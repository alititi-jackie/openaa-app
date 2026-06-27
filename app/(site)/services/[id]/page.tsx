import type { Metadata } from "next";
import { PostDetailView } from "@/components/posts/PostDetailView";
import { getAdminPostReturnHref } from "@/features/posts/adminReturn";
import { getPublicPostDetailContext } from "@/features/posts/queries";
import { generatePostDetailMetadata } from "@/features/posts/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return generatePostDetailMetadata(id, "service");
}

export default async function ServiceDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const [context, adminReturnHref] = await Promise.all([
    getPublicPostDetailContext(id, "service"),
    getAdminPostReturnHref(await searchParams),
  ]);
  const detail = context.data;

  return <PostDetailView post={detail?.post ?? null} adminReturnHref={adminReturnHref} previousPost={detail?.previousPost} nextPost={detail?.nextPost} relatedPosts={detail?.relatedPosts} />;
}
