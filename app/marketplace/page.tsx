import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { getPublicPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约华人二手市场",
  description: "纽约二手市场、出售、求购、跳蚤市场信息入口。",
  path: "/marketplace",
});

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const posts = await getPublicPosts({ type: "marketplace" });

  return <ChannelPageShell config={{ ...channelConfigs.marketplace, posts: posts.data, queryState: posts.state, errorMessage: posts.error }} />;
}
