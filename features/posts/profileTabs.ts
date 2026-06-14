import { formatPostCategoryLabel, postModeLabel, postStatusLabel } from "./display";
import { postChannelConfig } from "./channelConfig";
import { housingTypeFromValue } from "./options";
import type { PostCardView, PostStatus, PostType } from "./types";

export const PROFILE_POST_ALL_TYPE = "all";
export const PROFILE_POST_ALL_STATUS = "all";

export type ProfilePostTypeFilterValue = typeof PROFILE_POST_ALL_TYPE | string;
export type ProfilePostStatusFilterValue = typeof PROFILE_POST_ALL_STATUS | PostStatus;

export type ProfilePostFilterOption = {
  value: string;
  label: string;
};

export type ProfilePostFiltersState = {
  selectedType: ProfilePostTypeFilterValue;
  selectedStatus: ProfilePostStatusFilterValue;
};

type ProfileFilterSearchParams = {
  type?: string | string[];
  status?: string | string[];
  tab?: string | string[];
};

const PROFILE_POST_STATUS_VALUES: readonly PostStatus[] = ["published", "hidden", "draft", "expired", "pending_review", "rejected", "deleted"];
const BASE_PROFILE_POST_STATUS_VALUES: readonly PostStatus[] = ["published", "hidden"];

export function normalizeProfilePostTypeFilter(postType: PostType, value?: string | null): ProfilePostTypeFilterValue {
  const normalized = value?.trim();
  if (!normalized || normalized === PROFILE_POST_ALL_TYPE) return PROFILE_POST_ALL_TYPE;

  const options = typeOptionsFor(postType);
  if (postType === "housing" && value) {
    const housingType = housingTypeFromValue(value);
    if (housingType && options.some((option) => option.value === housingType)) return housingType;
  }

  return options.find((option) => option.value === normalized || option.label === normalized)?.value ?? PROFILE_POST_ALL_TYPE;
}

export function normalizeProfilePostStatusFilter(value?: string | null): ProfilePostStatusFilterValue {
  const normalized = value?.trim();
  if (!normalized || normalized === PROFILE_POST_ALL_STATUS) return PROFILE_POST_ALL_STATUS;
  return PROFILE_POST_STATUS_VALUES.includes(normalized as PostStatus) ? (normalized as PostStatus) : PROFILE_POST_ALL_STATUS;
}

export function normalizeProfilePostFilters(postType: PostType, params?: ProfileFilterSearchParams | null): ProfilePostFiltersState {
  const legacyTab = firstParam(params?.tab);

  return {
    selectedType: normalizeProfilePostTypeFilter(postType, firstParam(params?.type) ?? legacyTab),
    selectedStatus: normalizeProfilePostStatusFilter(firstParam(params?.status) ?? legacyTab),
  };
}

export function buildProfilePostTypeOptions(postType: PostType): ProfilePostFilterOption[] {
  return [
    { value: PROFILE_POST_ALL_TYPE, label: "全部类型" },
    ...typeOptionsFor(postType).map((option) => ({
      value: option.value,
      label: typeLabelFor(postType, option.value, option.label),
    })),
  ];
}

export function buildProfilePostStatusOptions(posts: PostCardView[] = []): ProfilePostFilterOption[] {
  const presentStatuses = new Set(posts.flatMap((post) => (post.status ? [post.status] : [])));
  const statuses = [
    ...BASE_PROFILE_POST_STATUS_VALUES,
    ...PROFILE_POST_STATUS_VALUES.filter((status) => !BASE_PROFILE_POST_STATUS_VALUES.includes(status) && presentStatuses.has(status)),
  ];

  return [
    { value: PROFILE_POST_ALL_STATUS, label: "全部状态" },
    ...statuses.flatMap((status) => {
      const label = postStatusLabel(status);
      return label ? [{ value: status, label }] : [];
    }),
  ];
}

export function filterAndSortProfilePosts(posts: PostCardView[], filters: ProfilePostFiltersState) {
  const filtered = posts.filter((post) => {
    return matchesTypeFilter(post, filters.selectedType) && matchesStatusFilter(post, filters.selectedStatus);
  });

  return [...filtered].sort((a, b) => {
    const statusDiff = statusRank(a.status) - statusRank(b.status);
    if (statusDiff !== 0) return statusDiff;
    return postTime(b) - postTime(a);
  });
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function typeOptionsFor(postType: PostType) {
  const config = postChannelConfig(postType);
  return postType === "service" ? (config.categoryOptions ?? []) : (config.modeOptions ?? []);
}

function typeLabelFor(postType: PostType, value: string, fallback: string) {
  if (postType === "service") return fallback;
  return postModeLabel(postType, value, "short") || fallback;
}

function matchesTypeFilter(post: PostCardView, selectedType: ProfilePostTypeFilterValue) {
  if (selectedType === PROFILE_POST_ALL_TYPE) return true;

  if (post.type === "service") {
    const selectedLabel = formatPostCategoryLabel("service", selectedType);
    return Boolean(selectedLabel && post.categoryValue === selectedLabel);
  }

  return post.mode === selectedType;
}

function matchesStatusFilter(post: PostCardView, selectedStatus: ProfilePostStatusFilterValue) {
  if (selectedStatus === PROFILE_POST_ALL_STATUS) return true;
  return post.status === selectedStatus;
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
