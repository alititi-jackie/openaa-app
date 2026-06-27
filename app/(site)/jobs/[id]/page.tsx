import { PostDetailView } from "@/components/posts/PostDetailView";
import { getAdminPostReturnHref } from "@/features/posts/adminReturn";
import { getPublicPostDetailContext } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "招聘详情",
  description: "OpenAA 纽约华人招聘详情。",
  path: "/jobs",
});

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const [context, adminReturnHref] = await Promise.all([
    getPublicPostDetailContext(id, "job"),
    getAdminPostReturnHref(await searchParams),
  ]);
  const detail = context.data;

  return <PostDetailView post={detail?.post ?? null} adminReturnHref={adminReturnHref} previousPost={detail?.previousPost} nextPost={detail?.nextPost} relatedPosts={detail?.relatedPosts} />;
}
