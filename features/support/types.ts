export type SupportTicketType =
  | "business"
  | "news_tip"
  | "feature_suggestion"
  | "other"
  | "admin_reply";

export type SupportTicketStatus = "new" | "viewed" | "deleted" | "pending" | "processing" | "replied" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export const SUPPORT_TICKET_TYPES: SupportTicketType[] = [
  "business",
  "news_tip",
  "feature_suggestion",
  "other",
  "admin_reply",
];

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = ["new", "viewed", "deleted"];
export const SUPPORT_TICKET_PRIORITIES: SupportTicketPriority[] = ["low", "normal", "high", "urgent"];

export const SUPPORT_TICKET_TYPE_LABELS: Record<SupportTicketType, string> = {
  business: "广告合作咨询",
  news_tip: "提交新闻线索",
  feature_suggestion: "功能建议",
  other: "其它问题",
  admin_reply: "回复管理员",
};

export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  new: "未查看",
  viewed: "已查看",
  deleted: "已删除",
  pending: "未查看",
  processing: "已查看",
  replied: "已查看",
  closed: "已查看",
};

export const SUPPORT_TICKET_PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  low: "低",
  normal: "普通",
  high: "高",
  urgent: "紧急",
};

export const supportTicketTypeOptions = SUPPORT_TICKET_TYPES.map((value) => ({
  value,
  label: SUPPORT_TICKET_TYPE_LABELS[value],
}));

export const supportTicketStatusOptions = SUPPORT_TICKET_STATUSES.map((value) => ({
  value,
  label: SUPPORT_TICKET_STATUS_LABELS[value],
}));

export const supportTicketPriorityOptions = SUPPORT_TICKET_PRIORITIES.map((value) => ({
  value,
  label: SUPPORT_TICKET_PRIORITY_LABELS[value],
}));

export type SupportTicketSettings = {
  enabled: boolean;
  dailyUserLimit: number;
  dailyVisitorLimit: number;
  dailyTotalLimit: number;
  contentMinLength: number;
  contentMaxLength: number;
  contactMaxLength: number;
  relatedUrlMaxLength: number;
};

export const DEFAULT_SUPPORT_TICKET_SETTINGS: SupportTicketSettings = {
  enabled: true,
  dailyUserLimit: 5,
  dailyVisitorLimit: 3,
  dailyTotalLimit: 100,
  contentMinLength: 10,
  contentMaxLength: 3000,
  contactMaxLength: 200,
  relatedUrlMaxLength: 500,
};

export function isSupportTicketType(value: string): value is SupportTicketType {
  return SUPPORT_TICKET_TYPES.includes(value as SupportTicketType);
}

export function isSupportTicketStatus(value: string): value is SupportTicketStatus {
  return SUPPORT_TICKET_STATUSES.includes(value as SupportTicketStatus);
}

export function isSupportTicketPriority(value: string): value is SupportTicketPriority {
  return SUPPORT_TICKET_PRIORITIES.includes(value as SupportTicketPriority);
}

export function normalizeSupportTicketType(value: string | null | undefined): SupportTicketType | "" {
  return value && isSupportTicketType(value) ? value : "";
}

export function normalizeSupportTicketStatus(value: string | null | undefined): SupportTicketStatus {
  return value && isSupportTicketStatus(value) ? value : "new";
}

export function normalizeSupportTicketPriority(value: string | null | undefined): SupportTicketPriority {
  return value && isSupportTicketPriority(value) ? value : "normal";
}
