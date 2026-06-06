import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChannelPageChrome } from "@/components/channels/ChannelPageChrome";
import type { ChannelKey } from "@/features/channels/types";
import { ChannelFilterBar } from "./ChannelFilterBar";
import { ChannelHero } from "./ChannelHero";
import { ChannelSeoCard } from "./ChannelSeoCard";
import { ChannelTabs } from "./ChannelTabs";
import { PostList, type PostListItem } from "./PostList";
import { PublishCta } from "./PublishCta";

export type ChannelPageConfig = {
  channelKey: ChannelKey;
  title: string;
  description?: string;
  path: string;
  icon: LucideIcon;
  tabs: string[];
  searchPlaceholder: string;
  posts: PostListItem[];
  queryState?: "ready" | "missing_config" | "error";
  errorMessage?: string;
  publishLabel?: string;
  seoTitle: string;
  seoContent: ReactNode;
};

export function ChannelPageShell({ config }: { config: ChannelPageConfig }) {
  return (
    <ChannelPageChrome channelKey={config.channelKey} path={config.path} title={config.title} description={config.description}>
      <ChannelHero
        title={config.title}
        description={config.description}
        icon={config.icon}
        actions={<PublishCta returnTo={config.path} label={config.publishLabel ?? "发布信息"} />}
      />
      <ChannelTabs tabs={config.tabs} />
      <ChannelFilterBar placeholder={config.searchPlaceholder} />
      {config.queryState === "error" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          内容读取暂时不可用：{config.errorMessage ?? "请稍后再试。"}
        </div>
      ) : config.queryState === "missing_config" ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Supabase 环境变量尚未配置，当前显示空列表；配置新 Supabase 后会读取公开发布内容。
        </div>
      ) : null}
      <PostList posts={config.posts} />
      <ChannelSeoCard title={config.seoTitle}>{config.seoContent}</ChannelSeoCard>
    </ChannelPageChrome>
  );
}
