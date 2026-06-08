import { postModeLabel } from "./display";
import type { PostCardView, PostStatus, PostType } from "./types";

export type ProfilePostTabValue = "all" | "hiring" | "seeking" | "supply" | "demand" | "selling" | "buying" | "published" | "hidden";

type ProfilePostTab = {
  value: ProfilePostTabValue;
  label: string;
  href: string;
};

const profileTabsByType: Record<PostType, ProfilePostTabValue[]> = {
  job: ["all", "hiring", "seeking", "published", "hidden"],
  housing: ["all", "supply", "demand", "published", "hidden"],
  marketplace: ["all", "selling", "buying", "published", "hidden"],
  service: ["all", "published", "hidden"],
};

const shortLabels: Partial<Record<ProfilePostTabValue, string>> = {
  all: "全部",
  supply: "供",
  demand: "需",
  published: "显示",
  hidden: "隐藏",
};

export function normalizeProfilePostTab(postType: PostType, value?: string | null): ProfilePostTabValue {
  const tabs = profileTabsByType[postType];
  return tabs.includes(value as ProfilePostTabValue) ? (value as ProfilePostTabValue) : "all";
}

export function buildProfilePostTabs(postType: PostType, activeTab: ProfilePostTabValue, path: string): ProfilePostTab[] {
  void activeTab;
  return profileTabsByType[postType].map((value) => ({
    value,
    label: labelFor(postType, value),
    href: value === "all" ? path : `${path}?tab=${value}`,
  }));
}

export function filterAndSortProfilePosts(posts: PostCardView[], activeTab: ProfilePostTabValue) {
  const filtered = posts.filter((post) => {
    if (activeTab === "all") return true;
    if (activeTab === "published" || activeTab === "hidden") return post.status === activeTab;
    return post.mode === activeTab;
  });

  return [...filtered].sort((a, b) => {
    const statusDiff = statusRank(a.status) - statusRank(b.status);
    if (statusDiff !== 0) return statusDiff;
    return postTime(b) - postTime(a);
  });
}

function labelFor(postType: PostType, value: ProfilePostTabValue) {
  if (shortLabels[value]) return shortLabels[value]!;
  return postModeLabel(postType, value, "short") || value;
}

function statusRank(status?: PostStatus) {
  if (status === "published") return 0;
  if (status === "hidden") return 1;
  return 2;
}

function postTime(post: PostCardView) {
  const value = post.publishedAt || post.createdAt;
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}
