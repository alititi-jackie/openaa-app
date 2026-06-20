import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { normalizePublicPostFilters } from "@/features/posts/filters";
import { getPublicPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约租房房屋信息",
  description: "纽约租房、求租、合租、房屋信息入口。",
  path: "/housing",
});

export const revalidate = 300;

export default async function HousingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = normalizePublicPostFilters(await searchParams);
  const posts = await getPublicPosts({ type: "housing", filters, showImageIndicator: true });

  return <ChannelPageShell config={{ ...channelConfigs.housing, filters, pagination: posts.pagination, posts: posts.data, queryState: posts.state, errorMessage: posts.error }} />;
}
