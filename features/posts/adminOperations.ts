import type { PostStatus } from "./types";

export type AdminPostOperation =
  | "hidden"
  | "published"
  | "pending"
  | "deleted"
  | "hide"
  | "restore_display"
  | "approve"
  | "reject"
  | "delete"
  | "mark_pending"
  | "notify_author"
  | "content_issue"
  | "image_issue"
  | "contact_issue"
  | "missing_info"
  | "wrong_category"
  | "duplicate_post";

export type AdminPostOperationConfig = {
  operation: AdminPostOperation;
  label: string;
  eventType: string;
  defaultTemplateKey: string;
  allowedStatuses: PostStatus[];
  statusAfter?: PostStatus;
  auditAction: string;
};

export const ADMIN_POST_OPERATION_CONFIGS: AdminPostOperationConfig[] = [
  {
    operation: "hide",
    label: "下架",
    eventType: "hidden",
    defaultTemplateKey: "admin_post_hidden",
    allowedStatuses: ["published"],
    statusAfter: "hidden",
    auditAction: "hide_post",
  },
  {
    operation: "restore_display",
    label: "恢复显示",
    eventType: "published",
    defaultTemplateKey: "admin_post_published",
    allowedStatuses: ["hidden", "rejected"],
    statusAfter: "published",
    auditAction: "publish_post",
  },
  {
    operation: "approve",
    label: "审核通过",
    eventType: "published",
    defaultTemplateKey: "admin_post_published",
    allowedStatuses: ["pending_review"],
    statusAfter: "published",
    auditAction: "approve_post",
  },
  {
    operation: "reject",
    label: "审核拒绝",
    eventType: "rejected",
    defaultTemplateKey: "admin_post_rejected",
    allowedStatuses: ["published", "hidden", "pending_review"],
    statusAfter: "rejected",
    auditAction: "reject_post",
  },
  {
    operation: "delete",
    label: "删除到回收站",
    eventType: "deleted",
    defaultTemplateKey: "admin_post_deleted",
    allowedStatuses: ["published", "hidden", "pending_review", "rejected"],
    statusAfter: "deleted",
    auditAction: "delete_post",
  },
  {
    operation: "mark_pending",
    label: "标记待审核",
    eventType: "pending",
    defaultTemplateKey: "content_issue",
    allowedStatuses: ["rejected"],
    statusAfter: "pending_review",
    auditAction: "mark_post_pending_review",
  },
  {
    operation: "notify_author",
    label: "通知作者",
    eventType: "notify_author",
    defaultTemplateKey: "content_issue",
    allowedStatuses: ["published", "hidden", "pending_review", "rejected"],
    auditAction: "notify_author",
  },
  {
    operation: "content_issue",
    label: "内容需要修改",
    eventType: "content_issue",
    defaultTemplateKey: "content_issue",
    allowedStatuses: ["published", "hidden", "pending_review", "rejected"],
    auditAction: "content_issue",
  },
  {
    operation: "image_issue",
    label: "图片需要修改",
    eventType: "image_issue",
    defaultTemplateKey: "image_issue",
    allowedStatuses: ["published", "hidden", "pending_review", "rejected"],
    auditAction: "image_issue",
  },
  {
    operation: "contact_issue",
    label: "联系方式需要修改",
    eventType: "contact_issue",
    defaultTemplateKey: "contact_issue",
    allowedStatuses: ["published", "hidden", "pending_review", "rejected"],
    auditAction: "contact_issue",
  },
  {
    operation: "missing_info",
    label: "信息需要补充",
    eventType: "missing_info",
    defaultTemplateKey: "missing_info",
    allowedStatuses: ["published", "hidden", "pending_review", "rejected"],
    auditAction: "missing_info",
  },
  {
    operation: "wrong_category",
    label: "分类需要修改",
    eventType: "wrong_category",
    defaultTemplateKey: "wrong_category",
    allowedStatuses: ["published", "hidden", "pending_review", "rejected"],
    auditAction: "wrong_category",
  },
  {
    operation: "duplicate_post",
    label: "重复发布提醒",
    eventType: "duplicate_post",
    defaultTemplateKey: "duplicate_post",
    allowedStatuses: ["published", "hidden", "pending_review", "rejected"],
    auditAction: "duplicate_post",
  },
];

const REPORT_TAB_OPERATION_CONFIGS: AdminPostOperationConfig[] = [
  {
    operation: "hidden",
    label: "下架",
    eventType: "hidden",
    defaultTemplateKey: "admin_post_hidden",
    allowedStatuses: ["published", "pending_review", "rejected"],
    statusAfter: "hidden",
    auditAction: "hide_post",
  },
  {
    operation: "published",
    label: "恢复显示",
    eventType: "published",
    defaultTemplateKey: "admin_post_published",
    allowedStatuses: ["hidden", "pending_review", "rejected"],
    statusAfter: "published",
    auditAction: "publish_post",
  },
  {
    operation: "pending",
    label: "标记待审核",
    eventType: "pending",
    defaultTemplateKey: "content_issue",
    allowedStatuses: ["published", "hidden", "rejected"],
    statusAfter: "pending_review",
    auditAction: "mark_post_pending_review",
  },
  {
    operation: "deleted",
    label: "删除到回收站",
    eventType: "deleted",
    defaultTemplateKey: "admin_post_deleted",
    allowedStatuses: ["published", "hidden", "pending_review", "rejected"],
    statusAfter: "deleted",
    auditAction: "delete_post",
  },
];

export function getAdminPostOperationConfig(operation: string | null | undefined) {
  return (
    ADMIN_POST_OPERATION_CONFIGS.find((config) => config.operation === operation) ??
    REPORT_TAB_OPERATION_CONFIGS.find((config) => config.operation === operation) ??
    null
  );
}

export function getAdminPostOperationOptions(status: PostStatus) {
  return ADMIN_POST_OPERATION_CONFIGS.filter((config) => config.allowedStatuses.includes(status));
}
