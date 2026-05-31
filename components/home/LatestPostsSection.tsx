import { EmptyState } from "@/components/common/EmptyState";
import { PostList, type PostListItem } from "@/components/posts/PostList";

export type LatestPostGroup = {
  title: string;
  description: string;
  posts: PostListItem[];
};

export function LatestPostsSection({ groups }: { groups: LatestPostGroup[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-slate-950">最新发布</h2>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <h3 className="font-black text-slate-950">{group.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{group.description}</p>
            </div>
            {group.posts.length > 0 ? (
              <PostList posts={group.posts} compact />
            ) : (
              <EmptyState title="暂无内容" description="这里会在后续 Phase 接入 Supabase 后显示真实发布。" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
