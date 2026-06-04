import { SecondhandDetailLegacyView } from "@/components/secondhand/SecondhandDetailLegacyView";
import { getPublicPostById } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "二手详情",
  description: "OpenAA 纽约二手交易详情。",
  path: "/secondhand",
});

export const dynamic = "force-dynamic";

export default async function SecondhandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPublicPostById(id, "marketplace");

  return <SecondhandDetailLegacyView post={post.data} />;
}
