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

function normalizedModeText(record: PostRecord) {
  if (record.post_type === "job") {
    const detail = firstDetail(record.post_details_jobs);
    return [record.category, record.subcategory, detail?.employment_type, detail?.job_category, record.title].filter(Boolean).join(" ");
  }

  if (record.post_type === "housing") {
    const detail = firstDetail(record.post_details_housing);
    return [record.category, record.subcategory, detail?.listing_type, detail?.housing_type, record.title].filter(Boolean).join(" ");
  }

  if (record.post_type === "marketplace") {
    const detail = firstDetail(record.post_details_marketplace);
    return [record.category, record.subcategory, detail?.listing_type, detail?.item_category, record.title].filter(Boolean).join(" ");
  }

  return searchableText(record);
}

function matchesMode(record: PostRecord, type: PostType, mode: string) {
  const text = normalizedModeText(record);

  if (type === "job") {
    if (mode === "jobs") return !matchesAny(text, ["求职", "seeking"]);
    if (mode === "talent") return matchesAny(text, ["求职", "seeking"]);
  }

  if (type === "housing") {
    if (mode === "listing") return !matchesAny(text, ["求租", "求购", "seeking", "buying"]);
    if (mode === "seeking") return matchesAny(text, ["求租", "求购", "seeking", "buying"]);
  }

  if (type === "marketplace") {
    if (mode === "selling") return matchesAny(text, ["出售", "selling"]) || !matchesAny(text, ["求购", "buying"]);
    if (mode === "buying") return matchesAny(text, ["求购", "buying"]);
  }

  return true;
}

function matchesWorkType(record: PostRecord, workType: string) {
  if (record.post_type !== "job") return true;

  const detail = firstDetail(record.post_details_jobs);
  return matchesText([detail?.employment_type, detail?.job_category, record.category, record.subcategory, record.title].filter(Boolean).join(" "), workType);
}

function matchesCategory(record: PostRecord, type: PostType, category: string) {
  if (!category || category === "全部") return true;
  const text = searchableText(record);

  if (type === "job") {
    const detail = firstDetail(record.post_details_jobs);
    return matchesText([detail?.job_category, record.category, record.subcategory, record.title].filter(Boolean).join(" "), category);
  }

  if (type === "housing") {
    const detail = firstDetail(record.post_details_housing);
    return matchesText([record.category, record.subcategory, detail?.listing_type, detail?.housing_type, record.title].filter(Boolean).join(" "), category);
  }

  if (type === "marketplace") {
    const detail = firstDetail(record.post_details_marketplace);
    return matchesText([record.category, record.subcategory, detail?.listing_type, detail?.item_category, record.title].filter(Boolean).join(" "), category);
  }

  if (type === "service") {
    if (category === "装修维修") return matchesAny(text, ["装修", "维修", "修理", "水电"]);
    if (category === "搬家运输") return matchesAny(text, ["搬家", "运输", "货运", "接送"]);
    if (category === "家政清洁") return matchesAny(text, ["家政", "清洁", "保洁", "月嫂", "看护"]);
    if (category === "房地产") return matchesAny(text, ["房地产", "地产", "买房", "卖房", "租房", "经纪"]);
    if (category === "汽车相关") return matchesAny(text, ["汽车", "修车", "驾校", "拖车"]);
    if (category === "法律移民") return matchesAny(text, ["法律", "律师", "移民", "公证", "翻译"]);
    if (category === "财税保险") return matchesAny(text, ["财税", "报税", "会计", "保险", "税"]);
    if (category === "电脑手机") return matchesAny(text, ["电脑", "手机", "网络", "数据"]);
    if (category === "餐饮商业") return matchesAny(text, ["餐饮", "商业", "店铺", "招牌", "设备"]);
    if (category === "教育培训") return matchesAny(text, ["教育", "培训", "补习", "学校", "课程"]);
    if (category === "其它服务") return true;
  }

  return matchesText(text, category);
}
