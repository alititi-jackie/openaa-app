export type FeedbackStatus = "pending" | "processing" | "resolved" | "ignored";

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已处理",
  ignored: "已忽略",
};

export const FEEDBACK_STATUS_PRIORITY: Record<FeedbackStatus, number> = {
  pending: 0,
  processing: 1,
  ignored: 2,
  resolved: 3,
};

export const FEEDBACK_TYPES = ["信息举报", "页面错误", "功能建议", "新闻线索 / 投稿建议", "广告合作", "其它问题"] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const feedbackTypeOptions = FEEDBACK_TYPES.map((type) => ({ value: type, label: type }));

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return value === "pending" || value === "processing" || value === "resolved" || value === "ignored";
}

export function normalizeFeedbackType(value: string | null | undefined): FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType) ? (value as FeedbackType) : FEEDBACK_TYPES[0];
}
