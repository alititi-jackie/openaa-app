import { HousingLegacyPage } from "@/components/housing/HousingLegacyPage";
import { ALL_HOUSING_REGIONS, normalizeHousingMode } from "@/features/housing/legacy";
import { getPublicHousingPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约租房房屋信息",
  description: "纽约租房、求租、合租、房屋信息入口。",
  path: "/housing",
});

export const dynamic = "force-dynamic";

export default async function HousingPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; mode?: string; q?: string; keyword?: string; region?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const mode = normalizeHousingMode(params.type ?? params.mode);
  const keyword = params.q ?? params.keyword ?? "";
  const region = params.region ?? ALL_HOUSING_REGIONS;
  const posts = await getPublicHousingPosts({ mode, keyword, region });

  return <HousingLegacyPage result={posts} mode={mode} keyword={keyword} region={region} />;
}
