import { Newspaper } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import type { NewsPostCard } from "@/features/news/types";
import { NewsCard } from "./NewsCard";

export function NewsList({ posts }: { posts: NewsPostCard[] }) {
  const [featured, ...rest] = posts;

  if (!featured) {
    return <EmptyState title="暂无新闻资讯" description="更多内容正在整理中，请稍后查看。" icon={<Newspaper size={20} aria-hidden="true" />} />;
  }

  return (
    <div className="space-y-4">
      <section>
        <p className="mb-2 text-sm font-black text-slate-800">推荐文章</p>
        <NewsCard post={featured} featured />
      </section>
      {rest.length > 0 ? (
        <section className="space-y-3">
          {rest.map((post) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
