import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
import { buildProfilePostTabs, type ProfilePostTabValue } from "@/features/posts/profileTabs";
import type { PostType } from "@/features/posts/types";

export function ProfilePostFilterTabs({ postType, activeTab, path }: { postType: PostType; activeTab: ProfilePostTabValue; path: string }) {
  return <HorizontalPillTabs tabs={buildProfilePostTabs(postType, activeTab, path)} activeValue={activeTab} ariaLabel="我的发布筛选" />;
}
