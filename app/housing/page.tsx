import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约租房房屋信息",
  description: "纽约租房、求租、合租、房屋信息入口。",
  path: "/housing",
});

export default function HousingPage() {
  return <ChannelPageShell config={channelConfigs.housing} />;
}
