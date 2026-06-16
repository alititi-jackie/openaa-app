export type SupportTicketType =
  | "report_content"
  | "page_issue"
  | "contact_issue"
  | "scam_report"
  | "feature_suggestion"
  | "business"
  | "account"
  | "other";

export type SupportTicketStatus = "pending" | "processing" | "replied" | "closed";

export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export const SUPPORT_TICKET_TYPES: SupportTicketType[] = [
  "report_content",
  "page_issue",
  "contact_issue",
  "scam_report",
  "feature_suggestion",
  "business",
  "account",
  "other",
];

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = ["pending", "processing", "replied", "closed"];

export const SUPPORT_TICKET_PRIORITIES: SupportTicketPriority[] = ["low", "normal", "high", "urgent"];

export const SUPPORT_TICKET_TYPE_LABELS: Record<SupportTicketType, string> = {
  report_content: "信息举报",
  page_issue: "页面问题",
  contact_issue: "联系方式异常",
  scam_report: "虚假 / 诈骗信息",
  feature_suggestion: "功能建议",
  business: "合作咨询",
  account: "账号问题",
  other: "其它",
};

export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  pending: "待处理",
  processing: "处理中",
  replied: "已回复",
  closed: "已关闭",
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

export function normalizeSupportTicketType(value: string | null | undefined): SupportTicketType {
  return value && isSupportTicketType(value) ? value : "other";
}

export function normalizeSupportTicketStatus(value: string | null | undefined): SupportTicketStatus {
  return value && isSupportTicketStatus(value) ? value : "pending";
}

export function normalizeSupportTicketPriority(value: string | null | undefined): SupportTicketPriority {
  return value && isSupportTicketPriority(value) ? value : "normal";
}

