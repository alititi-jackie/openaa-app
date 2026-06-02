export type FeedbackStatus = "open" | "in_review" | "resolved" | "closed";

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: "待处理",
  in_review: "处理中",
  resolved: "已处理",
  closed: "已关闭",
};

export const FEEDBACK_CATEGORY_LABELS: Record<string, string> = {
  issue: "问题反馈",
  suggestion: "功能建议",
  report: "内容举报",
  news_tip: "新闻线索",
  other: "其它",
};

export const feedbackCategoryOptions = [
  { value: "issue", label: FEEDBACK_CATEGORY_LABELS.issue },
  { value: "suggestion", label: FEEDBACK_CATEGORY_LABELS.suggestion },
  { value: "report", label: FEEDBACK_CATEGORY_LABELS.report },
  { value: "news_tip", label: FEEDBACK_CATEGORY_LABELS.news_tip },
  { value: "other", label: FEEDBACK_CATEGORY_LABELS.other },
] as const;

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return value === "open" || value === "in_review" || value === "resolved" || value === "closed";
}
