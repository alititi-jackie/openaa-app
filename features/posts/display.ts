import { POST_TYPE_LABELS } from "./constants";
import {
  HOUSING_TYPE_OPTIONS,
  JOB_MODE_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  JOB_TYPE_OPTIONS,
  JOB_SALARY_UNIT_OPTIONS,
  LOCATION_OPTIONS,
  MARKETPLACE_MODE_OPTIONS,
  MARKETPLACE_CATEGORY_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  housingTypeOption,
  type PostOption,
} from "./options";
import type { PostStatus, PostType } from "./types";

type ModeDisplay = { label: string; shortLabel: string; tone: string };
type MetaTone = "blue" | "orange" | "gray" | "service";

export const POST_STATUS_DISPLAY: Record<PostStatus, { label: string; tone: string }> = {
  draft: { label: "草稿", tone: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100" },
  pending_review: { label: "待审核", tone: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  published: { label: "显示中", tone: "bg-blue-50 text-blue-700 ring-1 ring-blue-100" },
  hidden: { label: "已隐藏", tone: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100" },
  rejected: { label: "已拒绝", tone: "bg-red-50 text-red-600 ring-1 ring-red-100" },
  expired: { label: "已过期", tone: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100" },
  deleted: { label: "已删除", tone: "bg-red-50 text-red-600 ring-1 ring-red-100" },
};

const DEFAULT_MODE_TONE = "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100";
const SUPPLY_MODE_TONE = "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
const DEMAND_MODE_TONE = "bg-orange-50 text-orange-700 ring-1 ring-orange-100";

function modeCssTone(value: string) {
  if (["hiring", "rent", "sale", "selling"].includes(value)) return SUPPLY_MODE_TONE;
  if (["seeking", "rent_request", "buy_request", "buying"].includes(value)) return DEMAND_MODE_TONE;
  return DEFAULT_MODE_TONE;
}

function shortModeLabel(label: string) {
  return label.replace("岗位", "").replace("人才", "").replace("商品", "").replace("信息", "");
}

function displayFromOptions(options: readonly PostOption[], toneForValue: (value: string) => string): Record<string, ModeDisplay> {
  return Object.fromEntries(
    options.map((option) => [
      option.value,
      {
        label: option.label,
        shortLabel: shortModeLabel(option.label),
        tone: toneForValue(option.value),
      },
    ]),
  );
}

export const POST_MODE_DISPLAY: Partial<Record<PostType, Record<string, ModeDisplay>>> = {
  job: displayFromOptions(JOB_MODE_OPTIONS, modeCssTone),
  housing: displayFromOptions(HOUSING_TYPE_OPTIONS, modeCssTone),
  marketplace: displayFromOptions(MARKETPLACE_MODE_OPTIONS, modeCssTone),
};

function normalizePostModeForDisplay(postType: PostType, mode: string) {
  const normalized = mode.trim().toLowerCase();

  if (postType === "housing") return housingTypeOption(mode).value;
  if (postType === "job") {
    if (normalized === "supply") return "hiring";
    if (normalized === "demand") return "seeking";
  }
  if (postType === "marketplace") {
    if (normalized === "supply" || normalized === "sell" || normalized === "sale") return "selling";
    if (normalized === "demand" || normalized === "buy") return "buying";
  }

  return mode;
}

export function formatPostStatusLabel(status?: PostStatus) {
  return status ? POST_STATUS_DISPLAY[status]?.label ?? "" : "";
}

export const postStatusLabel = formatPostStatusLabel;

export function postStatusTone(status?: PostStatus) {
  return status ? POST_STATUS_DISPLAY[status]?.tone ?? "" : "";
}

export function formatPostModeLabel(postType: PostType, mode?: string | null, variant: "full" | "short" = "full") {
  if (!mode) return "";
  const normalizedMode = normalizePostModeForDisplay(postType, mode);
  if (postType === "housing") return housingTypeOption(normalizedMode).label;
  const display = POST_MODE_DISPLAY[postType]?.[normalizedMode];
  if (!display) return "其它";
  return variant === "short" ? display.shortLabel : display.label;
}

export const postModeLabel = formatPostModeLabel;

export function postModeTone(postType: PostType, mode?: string | null) {
  if (!mode) return "";
  const normalizedMode = normalizePostModeForDisplay(postType, mode);
  return POST_MODE_DISPLAY[postType]?.[normalizedMode]?.tone ?? DEFAULT_MODE_TONE;
}

export function postModeMetaTone(postType: PostType, mode?: string | null): MetaTone {
  if (!mode) return "gray";
  if (postType === "service") return "service";

  const normalizedMode = normalizePostModeForDisplay(postType, mode);
  if (["hiring", "rent", "sale", "selling"].includes(normalizedMode)) return "blue";
  if (["seeking", "rent_request", "buy_request", "buying"].includes(normalizedMode)) return "orange";
  return "gray";
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
  return JOB_SALARY_UNIT_OPTIONS.find((option) => option.value === unit)?.suffix ?? "";
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

export function formatPostAuthorName(author?: { nickname?: string | null } | null) {
  return author?.nickname?.trim() || "匿名用户";
}

export function formatViewCount(value: number | string | null | undefined, options: { icon?: boolean; unit?: boolean } = {}) {
  const count = numberText(value) || "0";
  return `${options.icon ? "👁 " : ""}${count}${options.unit ? " 次浏览" : ""}`;
}

export function formatPostTime(value?: string | null, variant: "relative" | "shortDate" | "date" = "relative") {
  if (!value) return variant === "relative" ? "刚刚" : "时间未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return variant === "relative" ? "刚刚" : "时间未知";

  if (variant === "relative") return relativeTime(value) || "刚刚";
  if (variant === "shortDate") return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatLocationLabel(value?: string | null, fallback = "不限") {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  if (normalized === "不限" || normalized === "其它地区") return normalized;
  const option = LOCATION_OPTIONS.find((item) => item.value === normalized || item.label === normalized);
  return option?.label ?? "其它地区";
}

function optionLabel(options: readonly PostOption[], value?: string | null, fallback = "其它") {
  const normalized = value?.trim();
  if (!normalized) return "";
  return options.find((option) => option.value === normalized || option.label === normalized)?.label ?? fallback;
}

export function formatPostCategoryLabel(postType: PostType, value?: string | null) {
  if (postType === "job") return optionLabel(JOB_CATEGORY_OPTIONS, value, "其它职位");
  if (postType === "marketplace") return optionLabel(MARKETPLACE_CATEGORY_OPTIONS, value, "其它二手");
  if (postType === "service") return optionLabel(SERVICE_CATEGORY_OPTIONS, value, "其它服务");
  return value?.trim() || "";
}

export function formatJobWorkTypeLabel(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return "";

  const commonAliases: Record<string, string> = {
    fulltime: "全职",
    full_time: "全职",
    "full-time": "全职",
    parttime: "兼职",
    part_time: "兼职",
    "part-time": "兼职",
    contract: "合同",
    remote: "远程",
    internship: "实习",
    intern: "实习",
    other: "其它",
  };

  return optionLabel(JOB_TYPE_OPTIONS, normalized, commonAliases[normalized.toLowerCase()] ?? "其它");
}

export function buildPostDisplayBody(source: { body?: string | null; summary?: string | null }) {
  return source.body || source.summary || "暂无正文。";
}
