import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约华人二手市场",
  description: "纽约二手市场、出售、求购、跳蚤市场信息入口。",
  path: "/marketplace",
});

export default function MarketplacePage() {
  return <ChannelPageShell config={channelConfigs.marketplace} />;
}
