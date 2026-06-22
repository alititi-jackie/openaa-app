import { PostEditPage } from "@/components/posts/PostEditPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({ title: "编辑本地服务", path: "/services/edit", noIndex: true });

export default async function ServicesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostEditPage id={id} postType="service" returnTo={`/services/edit/${id}`} />;
}
