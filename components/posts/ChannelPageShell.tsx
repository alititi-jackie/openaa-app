import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChannelFilterBar } from "./ChannelFilterBar";
import { ChannelHero } from "./ChannelHero";
import { ChannelSeoCard } from "./ChannelSeoCard";
import { ChannelTabs } from "./ChannelTabs";
import { PostList, type PostListItem } from "./PostList";
import { PublishCta } from "./PublishCta";

export type ChannelPageConfig = {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  tabs: string[];
  searchPlaceholder: string;
  posts: PostListItem[];
  seoTitle: string;
  seoContent: ReactNode;
};

export function ChannelPageShell({ config }: { config: ChannelPageConfig }) {
  return (
    <div className="space-y-4">
      <ChannelHero title={config.title} description={config.description} icon={config.icon} />
      <PublishCta returnTo={config.path} label="发布信息占位" />
      <ChannelTabs tabs={config.tabs} />
      <ChannelFilterBar placeholder={config.searchPlaceholder} />
      <PostList posts={config.posts} />
      <ChannelSeoCard title={config.seoTitle}>{config.seoContent}</ChannelSeoCard>
    </div>
  );
}
