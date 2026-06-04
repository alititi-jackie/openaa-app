import { SecondhandLegacyPage } from "@/components/secondhand/SecondhandLegacyPage";
import { ALL_SECONDHAND_REGIONS, normalizeSecondhandMode } from "@/features/secondhand/legacy";
import { getPublicSecondhandPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约二手交易",
  description: "纽约二手交易、出售、求购、本地闲置信息入口。",
  path: "/secondhand",
});

export const dynamic = "force-dynamic";

export default async function SecondhandPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; mode?: string; q?: string; keyword?: string; category?: string; region?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const mode = normalizeSecondhandMode(params.type ?? params.mode);
  const keyword = params.q ?? params.keyword ?? "";
  const category = params.category ?? "";
  const region = params.region ?? ALL_SECONDHAND_REGIONS;
  const posts = await getPublicSecondhandPosts({ mode, keyword, category, region });

  return <SecondhandLegacyPage result={posts} mode={mode} keyword={keyword} category={category} region={region} basePath="/secondhand" />;
}
