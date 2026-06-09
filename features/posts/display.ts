import { POST_TYPE_LABELS } from "./constants";
import type { PostStatus, PostType } from "./types";

export const POST_STATUS_DISPLAY: Record<PostStatus, { label: string; tone: string }> = {
  draft: { label: "草稿", tone: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100" },
  pending_review: { label: "待审核", tone: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  published: { label: "显示中", tone: "bg-blue-50 text-blue-700 ring-1 ring-blue-100" },
  hidden: { label: "已隐藏", tone: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100" },
  rejected: { label: "已拒绝", tone: "bg-red-50 text-red-600 ring-1 ring-red-100" },
  expired: { label: "已过期", tone: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100" },
  deleted: { label: "已删除", tone: "bg-red-50 text-red-600 ring-1 ring-red-100" },
};

export const POST_MODE_DISPLAY: Partial<Record<PostType, Record<string, { label: string; shortLabel: string; tone: string }>>> = {
  job: {
    hiring: { label: "招聘岗位", shortLabel: "招聘", tone: "bg-blue-50 text-blue-700 ring-1 ring-blue-100" },
    seeking: { label: "求职人才", shortLabel: "求职", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  },
  housing: {
    supply: { label: "房源信息", shortLabel: "出租", tone: "bg-blue-50 text-blue-700 ring-1 ring-blue-100" },
    demand: { label: "求租求购", shortLabel: "求租", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  },
  marketplace: {
    selling: { label: "出售商品", shortLabel: "出售", tone: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
    buying: { label: "求购信息", shortLabel: "求购", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  },
};

export function postStatusLabel(status?: PostStatus) {
  return status ? POST_STATUS_DISPLAY[status]?.label ?? "" : "";
}

export function postStatusTone(status?: PostStatus) {
  return status ? POST_STATUS_DISPLAY[status]?.tone ?? "" : "";
}

export function postModeLabel(postType: PostType, mode?: string | null, variant: "full" | "short" = "full") {
  if (!mode) return "";
  const display = POST_MODE_DISPLAY[postType]?.[mode];
  return variant === "short" ? display?.shortLabel ?? "" : display?.label ?? "";
}

export function postModeTone(postType: PostType, mode?: string | null) {
  return mode ? POST_MODE_DISPLAY[postType]?.[mode]?.tone ?? "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100" : "";
}

export function numberText(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString("en-US") : String(value);
}

export function numericOrNull(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function numericOrUndefined(value: string | number | null | undefined) {
  const numeric = numericOrNull(value);
  return numeric === null ? undefined : numeric;
}

export function wageUnitLabel(unit?: string | null) {
  if (unit === "hour") return "/小时";
  if (unit === "day") return "/天";
  if (unit === "week") return "/周";
  if (unit === "month") return "/月";
  if (unit === "year") return "/年";
  return unit ?? "";
}

export function postTypeFallbackLabel(postType: PostType) {
  return POST_TYPE_LABELS[postType];
}

export function relativeTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "刚刚";
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}天前`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}周前`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${Math.max(1, diffMonths)}个月前`;

  return `${Math.max(1, Math.floor(diffDays / 365))}年前`;
}

export function buildPostDisplayBody(source: { body?: string | null; summary?: string | null }) {
  return source.body || source.summary || "暂无正文。";
}
