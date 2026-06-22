import { PostEditPage } from "@/components/posts/PostEditPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({ title: "编辑房屋", path: "/housing/edit", noIndex: true });

export default async function HousingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostEditPage id={id} postType="housing" returnTo={`/housing/edit/${id}`} />;
}
