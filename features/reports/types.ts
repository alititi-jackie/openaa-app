export type ReportReason =
  | "false_information"
  | "invalid_contact"
  | "scam"
  | "expired"
  | "illegal"
  | "other";

export const REPORT_REASONS: ReportReason[] = [
  "false_information",
  "invalid_contact",
  "scam",
  "expired",
  "illegal",
  "other",
];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  false_information: "内容不真实",
  invalid_contact: "联系方式异常",
  scam: "疑似诈骗",
  expired: "信息过期",
  illegal: "违法违规",
  other: "其它内容问题",
};

export const REPORT_AUTHOR_MESSAGE_TEMPLATES: Record<ReportReason, string> = {
  false_information: "经用户举报，此信息存在内容不真实的问题。请核实并修改发布内容，确保信息真实、准确、完整。",
  invalid_contact: "经用户举报，此信息存在联系方式异常的问题。请检查电话、微信、邮箱等联系方式是否真实有效。",
  scam: "经用户举报，此信息存在疑似诈骗或误导风险。请核实内容，不要发布虚假、诱导转账或存在安全风险的信息。",
  expired: "经用户举报，此信息可能已经过期。请确认信息是否仍然有效，并及时更新或下架。",
  illegal: "经用户举报，此信息可能涉及违法违规内容。请立即核实并修改，确保符合平台规则和法律要求。",
  other: "经用户举报，此信息存在需要核实的问题。请检查发布内容并按平台要求修改。",
};

export function isReportReason(value: string): value is ReportReason {
  return REPORT_REASONS.includes(value as ReportReason);
}

export function reportReasonOptions() {
  return REPORT_REASONS.map((value) => ({ value, label: REPORT_REASON_LABELS[value] }));
}
