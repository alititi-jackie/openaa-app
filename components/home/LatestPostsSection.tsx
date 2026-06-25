import type { PostListItem } from "@/components/posts/PostList";
import { HomeSectionShell } from "./HomeSectionShell";
import { LatestPostsList } from "./LatestPostsTabs";

export type LatestPostGroup = {
  key: string;
  title: string;
  navLabel?: string;
  description?: string;
  emptyMessage?: string;
  route: string;
  posts: PostListItem[];
  layout?: "grid" | "media" | "news";
  isVisible?: boolean;
};

export function LatestPostsSection({ groups, title = "最新发布", isVisible = true }: { groups: LatestPostGroup[]; title?: string; isVisible?: boolean }) {
  const visibleGroups = groups.filter((group) => group.isVisible !== false);

  if (!isVisible || visibleGroups.length === 0) {
    return null;
  }

  return (
    <HomeSectionShell title={title}>
      <LatestPostsList groups={visibleGroups} />
    </HomeSectionShell>
  );
}
