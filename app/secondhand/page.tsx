import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { normalizePublicPostFilters } from "@/features/posts/filters";
import { getPublicPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约华人二手市场",
  description: "纽约二手市场、出售、求购、跳蚤市场信息入口。",
  path: "/secondhand",
});

export const dynamic = "force-dynamic";

export default async function SecondhandPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = normalizePublicPostFilters(await searchParams);
  const posts = await getPublicPosts({ type: "marketplace", filters });

  return <ChannelPageShell config={{ ...channelConfigs.marketplace, filters, pagination: posts.pagination, priceFilterLabel: "价格", posts: posts.data, queryState: posts.state, errorMessage: posts.error }} />;
}
