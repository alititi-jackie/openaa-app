import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { getPublicPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约租房房屋信息",
  description: "纽约租房、求租、合租、房屋信息入口。",
  path: "/housing",
});

export const dynamic = "force-dynamic";

export default async function HousingPage() {
  const posts = await getPublicPosts({ type: "housing" });

  return <ChannelPageShell config={{ ...channelConfigs.housing, posts: posts.data, queryState: posts.state, errorMessage: posts.error }} />;
}
