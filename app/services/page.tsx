import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约本地服务",
  description: "纽约本地服务、维修、搬家、装修、报税等信息入口。",
  path: "/services",
});

export default function ServicesPage() {
  return <ChannelPageShell config={channelConfigs.services} />;
}
