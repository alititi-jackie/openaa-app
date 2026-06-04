import { HousingDetailLegacyView } from "@/components/housing/HousingDetailLegacyView";
import { getPublicPostById } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "房屋详情",
  description: "OpenAA 纽约房屋信息详情。",
  path: "/housing",
});

export const dynamic = "force-dynamic";

export default async function HousingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPublicPostById(id, "housing");

  return <HousingDetailLegacyView post={post.data} />;
}
