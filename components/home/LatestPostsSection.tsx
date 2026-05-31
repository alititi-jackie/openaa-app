import type { PostListItem } from "@/components/posts/PostList";
import { HomeSectionShell } from "./HomeSectionShell";
import { LatestPostsTabs } from "./LatestPostsTabs";

export type LatestPostGroup = {
  key: string;
  title: string;
  navLabel?: string;
  description?: string;
  route: string;
  posts: PostListItem[];
  layout?: "grid" | "media" | "news";
  isVisible?: boolean;
};

export function LatestPostsSection({ groups }: { groups: LatestPostGroup[] }) {
  return (
    <HomeSectionShell title="最新发布">
      <LatestPostsTabs groups={groups} />
    </HomeSectionShell>
  );
}
