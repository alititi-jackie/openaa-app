import type { PostStatus, PostType } from "./types";

export const PUBLIC_POST_TYPES: PostType[] = ["job", "housing", "marketplace", "service"];

export const POST_TYPE_TO_ROUTE: Record<PostType, string> = {
  job: "/jobs",
  housing: "/housing",
  marketplace: "/marketplace",
  service: "/services",
};

export const ROUTE_TO_POST_TYPE = {
  jobs: "job",
  housing: "housing",
  marketplace: "marketplace",
  services: "service",
} as const;

export const POST_TYPE_LABELS: Record<PostType, string> = {
  job: "招聘",
  housing: "房屋",
  marketplace: "二手",
  service: "本地服务",
};

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "草稿",
  pending_review: "待审核",
  published: "已发布",
  hidden: "已下架",
  rejected: "已拒绝",
  expired: "已过期",
  deleted: "已删除",
};

export const DEFAULT_CITY_SLUG = "ny";
export const DEFAULT_POST_LIMIT = 12;
