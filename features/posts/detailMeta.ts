import type { DetailMetaPill } from "@/components/posts/DetailMetaPills";
import {
  getHousingAmountTimeDisplay,
  getPostArea,
  getPostCategory,
  getPostMode,
  getPostModeDisplay,
  getPostPriceDisplay,
  getPostWorkType,
} from "./accessors";
import { postChannelConfig } from "./channelConfig";
import type { AuthorSummary, PostRecord } from "./types";

export const HOUSING_AMOUNT_TIME_META_LABEL = "房屋金额时间";

type BuildDetailMetaPillsOptions = {
  includeImageIcon?: boolean;
  surface?: "detail" | "card";
};

export function buildHousingAmountTimeMetaPill(record: PostRecord): DetailMetaPill | null {
  const value = getHousingAmountTimeDisplay(record);
  return value ? { key: "housingAmountTime", label: HOUSING_AMOUNT_TIME_META_LABEL, value } : null;
}

function compactPills(items: Array<DetailMetaPill | null>) {
  return items.filter((item): item is DetailMetaPill => Boolean(item?.value.trim()));
}

function businessPill(key: string, label: string, value: string, tone?: DetailMetaPill["tone"]): DetailMetaPill | null {
  return value ? { key, group: "business", label, value, tone } : null;
}

function commonDetailPills(published: string, viewCount: number): DetailMetaPill[] {
  return [
    { key: "source", group: "common", label: "来源", value: "华人Open" },
    { key: "views", group: "common", label: "浏览次数", value: String(viewCount) },
    { key: "publishedAt", group: "common", label: "发布时间", value: published },
  ];
}

function modeTone(record: PostRecord): DetailMetaPill["tone"] | undefined {
  const mode = getPostMode(record);

  if (record.post_type === "job") {
    if (mode === "hiring") return "blue";
    if (mode === "seeking") return "orange";
  }

  if (record.post_type === "housing") {
    if (mode === "rent" || mode === "sale") return "blue";
    if (mode === "rent_request" || mode === "buy_request") return "orange";
    if (mode === "other") return "gray";
  }

  if (record.post_type === "marketplace") {
    if (mode === "selling") return "blue";
    if (mode === "buying") return "orange";
    if (mode) return "gray";
  }

  return undefined;
}

function buildCardMetaPills(record: PostRecord, author?: AuthorSummary | null, viewCount = 0, options: BuildDetailMetaPillsOptions = {}): DetailMetaPill[] {
  const config = postChannelConfig(record.post_type);
  const published = record.published_at || record.created_at;
  const mode = record.post_type === "job" ? getPostWorkType(record) : getPostModeDisplay(record, "short");
  const category = getPostCategory(record);
  const area = getPostArea(record);
  const price = getPostPriceDisplay(record, record.post_type === "job");

  const items: DetailMetaPill[] = [
    { key: "author", label: "发布者", value: author?.nickname || "匿名用户" },
    { key: "views", label: "浏览次数", value: String(viewCount) },
    { key: "publishedAt", label: "相对时间", value: published },
  ];

  if (options.includeImageIcon) {
    items.push({ key: "image", label: "图片", value: "🖼️" });
  }

  if (record.post_type === "marketplace") {
    if (config.detailLabels.mode && mode) items.push({ label: config.detailLabels.mode, value: mode });
    if (config.detailLabels.category && category) items.push({ label: config.detailLabels.category, value: category });
    if (config.detailLabels.price && price) items.push({ label: config.detailLabels.price, value: price });
    if (area) items.push({ label: config.detailLabels.area, value: area });
    return items.filter((item) => item.value.trim());
  }

  if (area) items.push({ label: config.detailLabels.area, value: record.post_type === "job" ? `📍 ${area}` : area });
  if (record.post_type === "job") {
    if (config.detailLabels.category && category) items.push({ label: config.detailLabels.category, value: category });
    if (config.detailLabels.mode && mode) items.push({ label: config.detailLabels.mode, value: mode });
  } else if (config.detailLabels.mode && mode) {
    items.push({ label: config.detailLabels.mode, value: mode });
  }
  if (record.post_type !== "job" && config.detailLabels.category && category) items.push({ label: config.detailLabels.category, value: category });
  if (record.post_type !== "housing" && config.detailLabels.price && price) items.push({ label: config.detailLabels.price, value: price });

  return items.filter((item) => item.value.trim());
}

function buildDetailSurfaceMetaPills(record: PostRecord, viewCount = 0): DetailMetaPill[] {
  const published = record.published_at || record.created_at;
  const mode = getPostModeDisplay(record, "short");
  const category = getPostCategory(record);
  const area = getPostArea(record);
  const price = getPostPriceDisplay(record, record.post_type === "job");
  const workType = getPostWorkType(record);
  const common = commonDetailPills(published, viewCount);

  if (record.post_type === "job") {
    return compactPills([
      ...common,
      businessPill("mode", "招聘/求职", mode, modeTone(record)),
      businessPill("area", "地区", area),
      businessPill("category", "职位分类", category),
      businessPill("workType", "工作类型", workType),
      businessPill("price", "薪资", price),
    ]);
  }

  if (record.post_type === "housing") {
    return compactPills([
      ...common,
      businessPill("mode", "房屋类型", mode, modeTone(record)),
      businessPill("area", "地区", area),
      businessPill("category", "房型", category),
    ]);
  }

  if (record.post_type === "marketplace") {
    return compactPills([
      ...common,
      businessPill("mode", "出售/求购", mode, modeTone(record)),
      businessPill("area", "地区", area),
      businessPill("category", "商品分类", category),
      businessPill("price", "价格", price),
    ]);
  }

  return compactPills([
    ...common,
    businessPill("category", "服务分类", category, "service"),
    businessPill("area", "地区", area),
    businessPill("price", "价格", price),
  ]);
}

export function buildDetailMetaPills(record: PostRecord, author?: AuthorSummary | null, viewCount = 0, options: BuildDetailMetaPillsOptions = {}): DetailMetaPill[] {
  if (options.surface === "card") {
    return buildCardMetaPills(record, author, viewCount, options);
  }

  return buildDetailSurfaceMetaPills(record, viewCount);
}
