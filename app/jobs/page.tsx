import { ChannelPageShell } from "@/components/posts/ChannelPageShell";
import { channelConfigs } from "@/components/posts/channelConfigs";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约华人招聘",
  description: "纽约华人招聘、求职、兼职、全职信息入口。",
  path: "/jobs",
});

export default function JobsPage() {
  return <ChannelPageShell config={channelConfigs.jobs} />;
}
