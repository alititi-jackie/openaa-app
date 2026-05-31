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
  queryState?: "ready" | "missing_config" | "error";
  errorMessage?: string;
  seoTitle: string;
  seoContent: ReactNode;
};

export function ChannelPageShell({ config }: { config: ChannelPageConfig }) {
  return (
    <div className="space-y-4">
      <ChannelHero title={config.title} description={config.description} icon={config.icon} />
      <div className="-mt-1 flex justify-end">
        <PublishCta returnTo={config.path} label="发布信息" />
      </div>
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
    </div>
  );
}
