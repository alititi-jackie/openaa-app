import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { normalizePublicPostFilters } from "@/features/posts/filters";
import { getPublicPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约华人招聘",
  description: "纽约华人招聘、求职、兼职、全职信息入口。",
  path: "/jobs",
});

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = normalizePublicPostFilters(await searchParams);
  const posts = await getPublicPosts({ type: "job", filters });

  return <ChannelPageShell config={{ ...channelConfigs.jobs, filters, pagination: posts.pagination, priceFilterLabel: "薪资", posts: posts.data, queryState: posts.state, errorMessage: posts.error }} />;
}
