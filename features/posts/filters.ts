import type {
  PostRecord,
  PostSort,
  PostType,
  PublicPostFilters,
} from "./types";
import {
  getJobDetail,
  getPostArea,
  getPostCategory,
  getPostMode,
  getPostPriceValue,
  getPostSearchText,
  getPostWorkType,
} from "./accessors";
import { housingTypeFromValue } from "./options";

export const DEFAULT_PAGE_SIZE = 12;
export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
export const SORT_LABELS: Record<PostSort, string> = {
  latest: "最新优先",
  oldest: "最早发布",
  price_asc: "价格/薪资低到高",
  price_desc: "价格/薪资高到低",
};

const sortValues = new Set<PostSort>(["latest", "oldest", "price_asc", "price_desc"]);

type FilterInput = URLSearchParams | Record<string, string | string[] | number | undefined> | Partial<PublicPostFilters> | null | undefined;

export function normalizePublicPostFilters(input?: FilterInput): PublicPostFilters {
  return {
    mode: cleanText(readParam(input, "mode")),
    workType: cleanText(readParam(input, "workType")),
    category: cleanText(readParam(input, "category")),
    q: cleanText(readParam(input, "q")),
    area: cleanText(readParam(input, "area")),
    min: readNumber(input, "min"),
    max: readNumber(input, "max"),
    sort: readSort(input),
    page: readInteger(input, "page", 1, 1, 9999),
    pageSize: readInteger(input, "pageSize", DEFAULT_PAGE_SIZE, 1, 48),
  };
}

export function hasActivePostFilters(filters: PublicPostFilters) {
  return Boolean(
    filters.mode ||
      filters.workType ||
      filters.category ||
      filters.q ||
      filters.area ||
      filters.min !== undefined ||
      filters.max !== undefined ||
      filters.sort !== "latest" ||
      filters.page !== 1 ||
      filters.pageSize !== DEFAULT_PAGE_SIZE,
  );
}

export function applyPublicPostFilters(records: PostRecord[], type: PostType, filters: PublicPostFilters) {
  const filtered = records.filter((record) => {
    if (filters.q && !matchesKeyword(record, filters.q)) return false;
    if (filters.mode && !matchesMode(record, type, filters.mode)) return false;
    if (filters.workType && !matchesWorkType(record, filters.workType)) return false;
    if (filters.category && !matchesCategory(record, type, filters.category)) return false;
    if (filters.area && !matchesText(areaText(record), filters.area)) return false;
    if (type !== "service" && !matchesRange(record, filters.min, filters.max)) return false;
    return true;
  });

  return sortRecords(filtered, filters.sort);
}

export function priceValue(record: PostRecord) {
  return getPostPriceValue(record);
}

function readParam(input: FilterInput, key: string) {
  if (!input) return undefined;
  if (input instanceof URLSearchParams) return input.get(key) ?? undefined;
  const value = (input as Record<string, string | string[] | number | undefined>)[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first === undefined ? undefined : String(first);
}

function cleanText(value?: string) {
  return value?.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ").slice(0, 80) || undefined;
}

function readNumber(input: FilterInput, key: string) {
  const raw = readParam(input, key);
  if (!raw?.trim()) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function readInteger(input: FilterInput, key: string, fallback: number, min: number, max: number) {
  const raw = readParam(input, key);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function readSort(input: FilterInput): PostSort {
  const raw = readParam(input, "sort");
  return raw && sortValues.has(raw as PostSort) ? (raw as PostSort) : "latest";
}

function numeric(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function recordDate(record: PostRecord) {
  const date = new Date(record.published_at || record.created_at);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortRecords(records: PostRecord[], sort: PostSort) {
  return [...records].sort((a, b) => {
    if (sort === "oldest") return recordDate(a) - recordDate(b);
    if (sort === "price_asc" || sort === "price_desc") {
      const av = priceValue(a);
      const bv = priceValue(b);
      if (av === undefined && bv === undefined) return recordDate(b) - recordDate(a);
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      return sort === "price_asc" ? av - bv : bv - av;
    }
    return recordDate(b) - recordDate(a);
  });
}

function matchesRange(record: PostRecord, min?: number, max?: number) {
  if (min === undefined && max === undefined) return true;

  if (record.post_type === "job") {
    const detail = getJobDetail(record);
    const low = numeric(detail?.wage_min) ?? numeric(detail?.wage_max);
    const high = numeric(detail?.wage_max) ?? numeric(detail?.wage_min);
    if (low === undefined || high === undefined) return false;
    return (min === undefined || high >= min) && (max === undefined || low <= max);
  }

  const value = priceValue(record);
  if (value === undefined) return false;
  return (min === undefined || value >= min) && (max === undefined || value <= max);
}

function areaText(record: PostRecord) {
  return getPostArea(record);
}

function matchesKeyword(record: PostRecord, keyword: string) {
  return matchesText(getPostSearchText(record), keyword);
}

function matchesText(text: string, keyword: string) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function recordMode(record: PostRecord, type: PostType) {
  return type === record.post_type ? getPostMode(record) : "";
}

function matchesMode(record: PostRecord, type: PostType, mode: string) {
  if (type === "housing") {
    const normalized = housingTypeFromValue(mode);
    return Boolean(normalized && recordMode(record, type) === normalized);
  }
  return recordMode(record, type) === mode;
}

function matchesWorkType(record: PostRecord, workType: string) {
  if (record.post_type !== "job") return true;
  return getPostWorkType(record) === workType;
}

function matchesCategory(record: PostRecord, type: PostType, category: string) {
  if (!category || category === "全部") return true;
  return type === record.post_type && getPostCategory(record) === category;
}
