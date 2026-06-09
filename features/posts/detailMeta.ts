import type { DetailMetaPill } from "@/components/posts/DetailMetaPills";
import { getPostArea, getPostCategory, getPostModeDisplay, getPostPriceDisplay, getPostWorkType } from "./accessors";
import { postChannelConfig } from "./channelConfig";
import type { AuthorSummary, PostRecord } from "./types";

type BuildDetailMetaPillsOptions = {
  includeImageIcon?: boolean;
};

export function buildDetailMetaPills(record: PostRecord, author?: AuthorSummary | null, viewCount = 0, options: BuildDetailMetaPillsOptions = {}): DetailMetaPill[] {
  const config = postChannelConfig(record.post_type);
  const published = record.published_at || record.created_at;
  const mode = record.post_type === "job" ? getPostWorkType(record) : getPostModeDisplay(record, "short");
  const category = getPostCategory(record);
  const area = getPostArea(record);
  const price = getPostPriceDisplay(record, record.post_type === "job");

  const items: DetailMetaPill[] = [
    { label: "发布者", value: author?.nickname || "匿名用户" },
    { label: "浏览次数", value: String(viewCount) },
    { label: "相对时间", value: published },
  ];

  if (options.includeImageIcon) {
    items.push({ label: "图片", value: "🖼️" });
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
  if (config.detailLabels.price && price) items.push({ label: config.detailLabels.price, value: price });

  return items.filter((item) => item.value.trim());
}
