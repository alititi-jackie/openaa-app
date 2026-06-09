import type { PostType } from "./types";

export const PUBLIC_POST_TYPES: PostType[] = ["job", "housing", "marketplace", "service"];

export const POST_TYPE_TO_ROUTE: Record<PostType, string> = {
  job: "/jobs",
  housing: "/housing",
  marketplace: "/secondhand",
  service: "/services",
};

export const ROUTE_TO_POST_TYPE = {
  jobs: "job",
  housing: "housing",
  secondhand: "marketplace",
  services: "service",
} as const;

export const POST_TYPE_LABELS: Record<PostType, string> = {
  job: "招聘",
  housing: "房屋",
  marketplace: "二手",
  service: "本地服务",
};

export const DEFAULT_CITY_SLUG = "ny";
export const DEFAULT_POST_LIMIT = 12;
