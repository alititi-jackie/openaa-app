import type {
  HousingDetailRecord,
  JobDetailRecord,
  MarketplaceDetailRecord,
  PostRecord,
  PostSort,
  PostType,
  PublicPostFilters,
  ServiceDetailRecord,
} from "./types";

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
  return Boolean(filters.category || filters.q || filters.area || filters.min !== undefined || filters.max !== undefined || filters.sort !== "latest" || filters.page !== 1 || filters.pageSize !== DEFAULT_PAGE_SIZE);
}

export function applyPublicPostFilters(records: PostRecord[], type: PostType, filters: PublicPostFilters) {
  const filtered = records.filter((record) => {
    if (filters.q && !matchesKeyword(record, filters.q)) return false;
    if (filters.category && !matchesCategory(record, type, filters.category)) return false;
    if (filters.area && !matchesText(areaText(record), filters.area)) return false;
    if (type !== "service" && !matchesRange(record, filters.min, filters.max)) return false;
    return true;
  });

  return sortRecords(filtered, filters.sort);
}

export function priceValue(record: PostRecord) {
  if (record.post_type === "job") {
    const detail = firstDetail(record.post_details_jobs);
    return numeric(detail?.wage_min) ?? numeric(detail?.wage_max);
  }

  if (record.post_type === "housing") {
    const detail = firstDetail(record.post_details_housing);
    return numeric(detail?.rent_amount) ?? numeric(record.price_amount);
  }

  if (record.post_type === "marketplace") {
    const detail = firstDetail(record.post_details_marketplace);
    return numeric(detail?.price_amount) ?? numeric(record.price_amount);
  }

  return undefined;
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

function firstDetail<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
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
    const detail = firstDetail(record.post_details_jobs);
    const low = numeric(detail?.wage_min) ?? numeric(detail?.wage_max);
    const high = numeric(detail?.wage_max) ?? numeric(detail?.wage_min);
    if (low === undefined || high === undefined) return false;
    return (min === undefined || high >= min) && (max === undefined || low <= max);
  }

  const value = priceValue(record);
  if (value === undefined) return false;
  return (min === undefined || value >= min) && (max === undefined || value <= max);
}

function searchableText(record: PostRecord) {
  const parts: Array<string | null | undefined> = [record.title, record.summary, record.body, record.category, record.subcategory, areaText(record)];

  if (record.post_type === "job") {
    const detail = firstDetail(record.post_details_jobs);
    parts.push(detail?.employment_type, detail?.job_category, detail?.work_area, detail?.employer_type);
  } else if (record.post_type === "housing") {
    const detail = firstDetail(record.post_details_housing);
    parts.push(detail?.listing_type, detail?.housing_type, detail?.address_area);
  } else if (record.post_type === "marketplace") {
    const detail = firstDetail(record.post_details_marketplace);
    parts.push(detail?.listing_type, detail?.item_category, detail?.trade_area, detail?.condition);
  } else {
    const detail = firstDetail(record.post_details_services);
    parts.push(detail?.service_category, detail?.service_area, detail?.price_range, detail?.service_status);
  }

  return parts.filter(Boolean).join(" ");
}

function areaText(record: PostRecord) {
  if (record.post_type === "job") return firstDetail(record.post_details_jobs as JobDetailRecord[] | JobDetailRecord | null)?.work_area ?? "";
  if (record.post_type === "housing") return firstDetail(record.post_details_housing as HousingDetailRecord[] | HousingDetailRecord | null)?.address_area ?? "";
  if (record.post_type === "marketplace") return firstDetail(record.post_details_marketplace as MarketplaceDetailRecord[] | MarketplaceDetailRecord | null)?.trade_area ?? "";
  return firstDetail(record.post_details_services as ServiceDetailRecord[] | ServiceDetailRecord | null)?.service_area ?? "";
}

function matchesKeyword(record: PostRecord, keyword: string) {
  return matchesText(searchableText(record), keyword);
}

function matchesText(text: string, keyword: string) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function matchesAny(text: string, values: string[]) {
  const lowered = text.toLowerCase();
  return values.some((value) => lowered.includes(value.toLowerCase()));
}

function matchesCategory(record: PostRecord, type: PostType, category: string) {
  if (!category || category === "全部") return true;
  const text = searchableText(record);

  if (type === "job") {
    const detail = firstDetail(record.post_details_jobs);
    if (category === "求职") return matchesAny([record.category, detail?.employment_type, record.title].filter(Boolean).join(" "), ["求职", "seeking"]);
    if (category === "全职") return matchesAny([detail?.employment_type, detail?.job_category, record.category].filter(Boolean).join(" "), ["全职", "full"]);
    if (category === "兼职") return matchesAny([detail?.employment_type, detail?.job_category, record.category].filter(Boolean).join(" "), ["兼职", "part"]);
    if (category === "餐馆") return matchesAny(text, ["餐馆", "餐饮"]);
    if (category === "办公室") return matchesAny(text, ["办公室", "文职", "运营"]);
  }

  if (type === "housing") {
    const detail = firstDetail(record.post_details_housing);
    if (category === "出租") return matchesAny([record.category, detail?.listing_type].filter(Boolean).join(" "), ["出租", "renting"]);
    if (category === "求租") return matchesAny([record.category, detail?.listing_type].filter(Boolean).join(" "), ["求租", "求购", "seeking", "buying"]);
    if (category === "合租") return matchesAny(text, ["合租", "室友"]);
    if (category === "转租") return matchesAny(text, ["转租"]);
    if (category === "房屋") return matchesAny([record.category, detail?.housing_type, detail?.listing_type].filter(Boolean).join(" "), ["房屋", "整租", "单房", "主卧", "次卧", "一室", "两室"]);
  }

  if (type === "marketplace") {
    const detail = firstDetail(record.post_details_marketplace);
    if (category === "出售") return matchesAny([record.category, detail?.listing_type].filter(Boolean).join(" "), ["出售", "selling"]);
    if (category === "求购") return matchesAny([record.category, detail?.listing_type].filter(Boolean).join(" "), ["求购", "buying"]);
    if (category === "家具") return matchesAny(text, ["家具", "家电", "桌", "椅", "床", "沙发"]);
    if (category === "电器") return matchesAny(text, ["电器", "电子", "电脑", "手机", "冰箱", "洗衣机"]);
    if (category === "搬家") return matchesAny(text, ["搬家", "清仓"]);
  }

  if (type === "service") {
    if (category === "搬家") return matchesAny(text, ["搬家", "运输"]);
    if (category === "维修") return matchesAny(text, ["维修", "修理"]);
    if (category === "装修") return matchesAny(text, ["装修", "水电"]);
    if (category === "报税") return matchesAny(text, ["报税", "会计", "税"]);
    if (category === "清洁") return matchesAny(text, ["清洁", "保洁", "家政"]);
  }

  return matchesText(text, category);
}
