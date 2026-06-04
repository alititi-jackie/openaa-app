import type { JobDetailRecord, PostCardView, PostRecord } from "@/features/posts/types";

export const ALL_JOB_REGIONS = "全部";

export const JOB_TYPES = ["全职", "兼职", "合同", "远程", "实习"] as const;

export const JOB_CATEGORIES = [
  "餐饮行业",
  "美容按摩",
  "装修建筑",
  "文职运营",
  "医疗药房",
  "家政保姆",
  "司机送货",
  "门店零售",
  "仓库工厂",
  "汽车维修",
  "酒吧KTV",
  "教师培训",
  "技术人才",
  "其它职位",
] as const;

export const JOB_LOCATIONS = [
  "纽约 New York",
  "法拉盛 Flushing",
  "皇后区 Queens",
  "布鲁克林 Brooklyn",
  "曼哈顿 Manhattan",
  "布朗士 Bronx",
  "史登岛 Staten Island",
  "长岛 Long Island",
  "上州纽约 Upstate NY",
  "新泽西 New Jersey",
  "其它地区 Other",
] as const;

export type JobMode = "hiring" | "seeking";

export type JobListFilters = {
  mode: JobMode;
  search?: string;
  jobType?: string;
  category?: string;
  location?: string;
};

export function firstJobDetail(record: PostRecord): JobDetailRecord | null {
  const detail = record.post_details_jobs;
  if (!detail) return null;
  return Array.isArray(detail) ? (detail[0] ?? null) : detail;
}

export function readJobModeFromMetadata(metadata: Record<string, unknown> | null | undefined): JobMode | null {
  const raw = metadata?.job_mode ?? metadata?.type ?? metadata?.legacy_type;
  return raw === "seeking" || raw === "hiring" ? raw : null;
}

export function inferJobMode(record: PostRecord): JobMode {
  const metadataMode = readJobModeFromMetadata(record.metadata);
  if (metadataMode) return metadataMode;

  const haystack = [record.title, record.summary, record.body, record.category].filter(Boolean).join(" ");
  return /求职|个人简介|找工作|求工/.test(haystack) ? "seeking" : "hiring";
}

export function getJobModeFromCard(post: PostCardView): JobMode {
  return post.job?.mode ?? (/求职|个人简介|找工作|求工/.test(`${post.title} ${post.description}`) ? "seeking" : "hiring");
}

export function formatJobDate(value: string | null | undefined) {
  if (!value) return "最新";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "最新";

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

export function normalizeSalaryUnit(unit?: string | null) {
  if (unit === "/小时" || unit === "hour") return "/小时";
  if (unit === "/月薪" || unit === "month") return "/月薪";
  if (unit === "/年薪" || unit === "year") return "/年薪";
  return "/小时";
}

function salaryNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

export function formatJobSalary(min?: number | string | null, max?: number | string | null, unit?: string | null) {
  const minVal = salaryNumber(min);
  const maxVal = salaryNumber(max);
  const salary = minVal > 0 ? minVal : maxVal > 0 ? maxVal : 0;
  if (salary <= 0) return "薪资电议";
  return `${salary} ${normalizeSalaryUnit(unit)}`;
}

export function formatJobLocation(location?: string | null) {
  return location?.trim() || "纽约 New York";
}

export function isEffectivePinned(metadata: Record<string, unknown> | null | undefined, status?: string) {
  if (status && status !== "published") return false;
  const pinned = metadata?.is_pinned ?? metadata?.pinned;
  if (pinned !== true) return false;
  const until = typeof metadata?.pinned_until === "string" ? metadata.pinned_until : null;
  if (!until) return true;
  const untilTime = new Date(until).getTime();
  return Number.isNaN(untilTime) ? true : untilTime > Date.now();
}

export function pinnedOrder(metadata: Record<string, unknown> | null | undefined) {
  const raw = metadata?.pinned_order;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
