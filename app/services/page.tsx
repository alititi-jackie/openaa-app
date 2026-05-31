import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { getPublicPosts } from "@/features/posts/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约本地服务",
  description: "纽约本地服务、维修、搬家、装修、报税等信息入口。",
  path: "/services",
});

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const posts = await getPublicPosts({ type: "service" });

  return <ChannelPageShell config={{ ...channelConfigs.services, posts: posts.data, queryState: posts.state, errorMessage: posts.error }} />;
}
