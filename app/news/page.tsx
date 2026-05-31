import { Newspaper, Star } from "lucide-react";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { ChannelTabs } from "@/components/posts/ChannelTabs";
import { PostList } from "@/components/posts/PostList";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约华人新闻",
  description: "纽约华人本地新闻、新手指南、DMV 教程、生活指南和平台公告。",
  path: "/news",
});

export default function NewsPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-blue-700">
          <Newspaper size={24} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-black leading-tight text-slate-950">纽约华人新闻</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">本地新闻、新手指南、DMV 教程、生活指南和平台公告的频道壳。</p>
      </section>
      <ChannelTabs tabs={["全部", "本地新闻", "新手指南", "DMV 教程", "生活指南", "平台公告"]} />
      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-blue-700">
          <Star size={18} aria-hidden="true" />
          <h2 className="font-black">推荐新闻</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">推荐新闻占位，后续接入真实新闻和后台发布流程。</p>
      </section>
      <PostList
        posts={[
          { title: "纽约生活指南占位", description: "后续显示真实新闻摘要、分类和发布时间。", href: "/news", meta: "占位", tag: "指南" },
          { title: "平台公告占位", description: "后续显示 OpenAA 平台公告。", href: "/news", meta: "占位", tag: "公告" },
        ]}
      />
      <ChannelSeoCard title="纽约华人新闻与生活指南">
        OpenAA 新闻频道会逐步整理纽约本地资讯、新手生活指南、DMV 学习说明和平台公告。当前阶段只建立公开频道基础壳，不接真实新闻数据。
      </ChannelSeoCard>
    </div>
  );
}
