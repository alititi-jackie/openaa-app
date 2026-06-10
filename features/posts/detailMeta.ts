import type { DetailMetaPill } from "@/components/posts/DetailMetaPills";
import {
  getHousingAmountTimeDisplay,
  getPostArea,
  getPostCategory,
  getPostMode,
  getPostPriceDisplay,
  getPostWorkType,
} from "./accessors";
import {
  formatLocationLabel,
  formatPostAuthorName,
  formatPostCategoryLabel,
  formatPostModeLabel,
  formatViewCount,
  postModeMetaTone,
} from "./display";
import type { AuthorSummary, PostRecord } from "./types";

export const HOUSING_AMOUNT_TIME_META_LABEL = "房屋金额时间";

type BuildDetailMetaPillsOptions = {
  showImageIndicator?: boolean;
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

function commonDetailPills(author: AuthorSummary | null | undefined, published: string, viewCount: number): DetailMetaPill[] {
  return [
    { key: "author", group: "common", label: "发布者", value: formatPostAuthorName(author) },
    { key: "views", group: "common", label: "浏览次数", value: formatViewCount(viewCount) },
    { key: "publishedAt", group: "common", label: "发布时间", value: published },
  ];
}

function modeTone(record: PostRecord): DetailMetaPill["tone"] | undefined {
  return postModeMetaTone(record.post_type, getPostMode(record));
}

function buildDetailSurfaceMetaPills(record: PostRecord, author?: AuthorSummary | null, viewCount = 0, options: BuildDetailMetaPillsOptions = {}): DetailMetaPill[] {
  const published = record.published_at || record.created_at;
  const mode = formatPostModeLabel(record.post_type, getPostMode(record), "short");
  const category = formatPostCategoryLabel(record.post_type, getPostCategory(record));
  const area = formatLocationLabel(getPostArea(record));
  const price = getPostPriceDisplay(record, record.post_type === "job");
  const workType = getPostWorkType(record);
  const common = commonDetailPills(author, published, viewCount);
  const image: DetailMetaPill | null = options.showImageIndicator ? { key: "image", group: "common", label: "图片", value: "🖼️" } : null;

  if (record.post_type === "job") {
    return compactPills([
      ...common,
      image,
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
      image,
      businessPill("mode", "房屋类型", mode, modeTone(record)),
      businessPill("area", "地区", area),
      businessPill("category", "房型", category),
    ]);
  }

  if (record.post_type === "marketplace") {
    return compactPills([
      ...common,
      image,
      businessPill("mode", "出售/求购", mode, modeTone(record)),
      businessPill("area", "地区", area),
      businessPill("category", "商品分类", category),
      businessPill("price", "价格", price),
    ]);
  }

  return compactPills([
    ...common,
    image,
    businessPill("category", "服务分类", category, "service"),
    businessPill("area", "地区", area),
    businessPill("price", "价格", price),
  ]);
}

export function buildDetailMetaPills(record: PostRecord, author?: AuthorSummary | null, viewCount = 0, options: BuildDetailMetaPillsOptions = {}): DetailMetaPill[] {
  return buildDetailSurfaceMetaPills(record, author, viewCount, options);
}
