import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { normalizePublicPostFilters } from "@/features/posts/filters";
import { getPublicPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约本地服务",
  description: "纽约本地服务、维修、搬家、装修、报税等信息入口。",
  path: "/services",
});

export const revalidate = 300;

export default async function ServicesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawFilters = normalizePublicPostFilters(await searchParams);
  const filters = { ...rawFilters, min: undefined, max: undefined, sort: rawFilters.sort === "oldest" ? ("oldest" as const) : ("latest" as const) };
  const posts = await getPublicPosts({ type: "service", filters });

  return <ChannelPageShell config={{ ...channelConfigs.services, filters, pagination: posts.pagination, posts: posts.data, queryState: posts.state, errorMessage: posts.error }} />;
}
