import { PostDetailView } from "@/components/posts/PostDetailView";
import { getAdminPostReturnHref } from "@/features/posts/adminReturn";
import { getPublicPostById } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "本地服务详情",
  description: "OpenAA 纽约本地服务详情。",
  path: "/services",
});

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const [post, adminReturnHref] = await Promise.all([
    getPublicPostById(id, "service"),
    getAdminPostReturnHref(await searchParams),
  ]);

  return <PostDetailView post={post.data} adminReturnHref={adminReturnHref} />;
}
