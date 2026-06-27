"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminActionForm, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminCountPillBar, type AdminCountPillItem } from "@/components/admin/AdminCountPillBar";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { AdminPostManageDialog } from "@/components/posts/AdminPostManageDialog";
import { type AdminPostActionState } from "@/features/posts/adminActions";
import type { AdminPostListItem, AdminPostNotificationTemplate, AdminPostsCounts, AdminPostsPermissions as AdminPostsPermissionSet } from "@/features/posts/adminQueries";
import { POST_TYPE_LABELS, PUBLIC_POST_TYPES } from "@/features/posts/constants";
import { postStatusTone } from "@/features/posts/display";
import { updateDailyPostLimit } from "@/features/settings/adminActions";
import type { PostStatus, PostType } from "@/features/posts/types";

type TemplateOption = {
  key: string;
  title: string;
  body: string;
};

type NotificationPostRef = {
  id: string;
  title: string;
};

const initialActionState: AdminPostActionState = { ok: true, message: "" };

const postTypeOptions: Array<{ value: PostType | "all"; label: string }> = [
  { value: "all", label: "全部类型" },
  ...PUBLIC_POST_TYPES.map((type) => ({ value: type, label: POST_TYPE_LABELS[type] })),
];

const postStatusOptions: Array<{ value: PostStatus | "all"; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "pending_review", label: "待审核" },
  { value: "published", label: "已发布" },
  { value: "hidden", label: "已下架" },
  { value: "rejected", label: "已拒绝" },
];

export function AdminPostsPermissionBadges({ permissions }: { permissions: AdminPostsPermissionSet }) {
  return (
    <>
      <AdminPermissionBadge allowed={permissions.viewPosts} label="view_posts" />
      <AdminPermissionBadge allowed={permissions.moderatePosts} label="moderate_posts" />
    </>
  );
}

export function AdminPostsFilter({ type, status, q, author }: { type?: string; status?: string; q?: string; author?: string }) {
  return (
    <form action="/admin/user-posts" className="grid gap-3 md:grid-cols-[minmax(0,180px)_minmax(0,180px)_1fr_auto]">
      {author ? <input type="hidden" name="author" value={author} /> : null}
      <select
        name="type"
        defaultValue={type ?? "all"}
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
      >
        {postTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        name="status"
        defaultValue={status ?? "all"}
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
      >
        {postStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="搜索标题、内容或作者"
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
      />
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        筛选
      </button>
    </form>
  );
}

export function AdminPostsCountBars({ counts, activeType, activeStatus }: { counts: AdminPostsCounts; activeType?: PostType | "all"; activeStatus?: PostStatus | "all" }) {
  const typeItems: AdminCountPillItem[] = [
    { key: "all", label: "全部", count: counts.total, href: "/admin/user-posts", active: !activeType || activeType === "all", tone: "primary" },
    ...PUBLIC_POST_TYPES.map((type) => ({
      key: type,
      label: POST_TYPE_LABELS[type],
      count: counts.byType[type] ?? 0,
      href: `/admin/user-posts?type=${type}`,
      active: activeType === type,
    })),
  ];
  const statusItems: AdminCountPillItem[] = postStatusOptions
    .filter((option): option is { value: PostStatus; label: string } => option.value !== "all")
    .map((option) => ({
      key: option.value,
      label: option.label,
      count: counts.byStatus[option.value] ?? 0,
      href: `/admin/user-posts?status=${option.value}`,
      active: activeStatus === option.value,
      tone: postStatusCountTone(option.value),
    }));

  return (
    <div className="mb-4 space-y-2">
      <AdminCountPillBar items={typeItems} />
      <AdminCountPillBar items={statusItems} />
    </div>
  );
}

export function DailyPostLimitPanel({ dailyPostLimit, canManage }: { dailyPostLimit: number; canManage: boolean }) {
  return (
    <details className="group rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">每日发布上限</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">每个账号每天最多可发布 {dailyPostLimit} 条信息</p>
        </div>
        <span className="inline-flex min-h-9 items-center rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
          <span className="group-open:hidden">展开</span>
          <span className="hidden group-open:inline">收起</span>
        </span>
      </summary>
      <div className="mt-3 border-t border-slate-100 pt-3">
        {canManage ? (
          <AdminActionForm action={updateDailyPostLimit} submitLabel="保存发布上限" className="space-y-3">
            <AdminTextInput label="每日发布上限" name="daily_post_limit" type="number" defaultValue={dailyPostLimit} required />
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
              允许范围：1~100。保存后会立即影响普通用户每日发布数量，并记录后台审计日志。
            </p>
          </AdminActionForm>
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">当前账号只能查看发布上限，不能修改。</p>
        )}
      </div>
    </details>
  );
}

export function AdminPostsList({ posts, permissions, templates }: { posts: AdminPostListItem[]; permissions: AdminPostsPermissionSet; templates: AdminPostNotificationTemplate[] }) {
  if (posts.length === 0) {
    return <AdminEmptyState title="暂无用户发布信息。" compact align="left" />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <article key={post.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{post.typeLabel}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${postStatusTone(post.status)}`}>{adminPostStatusLabel(post.status)}</span>
              </div>
              <h3 className="mt-2 line-clamp-2 font-black text-slate-950">{post.title}</h3>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                <span>发布时间：{formatDate(post.publishedAt ?? post.createdAt)}</span>
                <span>更新时间：{formatDate(post.updatedAt)}</span>
              </div>
              {post.lastAdminAction ? <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">管理员处理：{adminActionLabel(post.lastAdminAction, post.lastAdminActionTemplateKey, post.lastAdminActionReason)}</p> : null}
            </div>
            <PostListActions post={post} permissions={permissions} templates={templates} />
          </div>
        </article>
      ))}
    </div>
  );
}

function PostListActions({ post, permissions, templates }: { post: AdminPostListItem; permissions: AdminPostsPermissionSet; templates: AdminPostNotificationTemplate[] }) {
  return (
    <div className="flex w-full flex-col items-start gap-2 md:w-auto md:max-w-xs md:items-end">
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <AdminActionButton href={frontPostHref(post)} variant="neutral">查看</AdminActionButton>
        <AdminActionButton href={`/admin/user-posts/${post.id}`} variant="info">详情</AdminActionButton>
        {permissions.moderatePosts ? (
          <AdminPostManageDialog key={`${post.id}-${post.status}`} post={post} templates={templates} />
        ) : null}
      </div>
    </div>
  );
}

export function AdminPostsPagination({
  page,
  pageCount,
  totalCount,
  type,
  status,
  q,
  author,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  type?: string;
  status?: string;
  q?: string;
  author?: string;
}) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), type, status, q, author });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), type, status, q, author });

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
      <span>
        共 {totalCount} 条 · 第 {page} / {pageCount} 页
      </span>
      <div className="flex flex-wrap gap-2">
        {page > 1 ? (
          <Link href={previous} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
            上一页
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link href={next} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
            下一页
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function AdminPostNotifyAction({
  action,
  post,
  status,
  operation,
  label,
  defaultTemplateKey,
  variant = "primary",
  notifyOnly = false,
  templates,
}: {
  action: (state: AdminPostActionState, formData: FormData) => Promise<AdminPostActionState>;
  post: NotificationPostRef;
  status?: PostStatus;
  operation?: string;
  label: string;
  defaultTemplateKey: string;
  variant?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  notifyOnly?: boolean;
  templates: AdminPostNotificationTemplate[];
}) {
  const defaultTemplate = getTemplate(templates, defaultTemplateKey);
  const [open, setOpen] = useState(false);
  const [templateKey, setTemplateKey] = useState(defaultTemplate.key);
  const [title, setTitle] = useState(defaultTemplate.title);
  const [body, setBody] = useState(defaultTemplate.body);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const selectedTemplate = useMemo(() => getTemplate(templates, templateKey), [templateKey, templates]);

  function handleTemplateChange(nextKey: string) {
    const nextTemplate = getTemplate(templates, nextKey);
    setTemplateKey(nextTemplate.key);
    setTitle(nextTemplate.title);
    setBody(nextTemplate.body);
  }

  return (
    <>
      <AdminActionButton onClick={() => setOpen(true)} variant={variant}>
        {label}
      </AdminActionButton>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <form action={formAction} className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <input type="hidden" name="id" value={post.id} />
            {status ? <input type="hidden" name="status" value={status} /> : null}
            {operation ? <input type="hidden" name="operation" value={operation} /> : null}
            <input type="hidden" name="notification_template_key" value={templateKey} />
            <input type="hidden" name="notification_action_url" value="/profile/posts" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">通知用户</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{post.title}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                取消
              </button>
            </div>
            <label className="mt-4 grid gap-1.5 text-sm font-bold text-slate-700">
              <span>模板</span>
              <select
                value={templateKey}
                onChange={(event) => handleTemplateChange(event.target.value)}
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
              >
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.title} · {template.key}
                    </option>
                  ))
                ) : (
                  <option value={templateKey}>模板暂时不可用</option>
                )}
              </select>
            </label>
            <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">当前模板：{selectedTemplate.key}</p>
            <label className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
              <span>通知标题</span>
              <input name="notification_title" value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500" />
            </label>
            <label className="mt-3 grid gap-1.5 text-sm font-bold text-slate-700">
              <span>通知正文</span>
              <textarea name="notification_body" rows={5} value={body} onChange={(event) => setBody(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500" />
            </label>
            {state.message ? <p className={state.ok ? "mt-3 text-sm font-semibold text-emerald-700" : "mt-3 text-sm font-semibold text-red-600"}>{state.message}</p> : null}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-60">
                取消
              </button>
              {!notifyOnly ? (
                <button type="submit" disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                  不通知用户，直接执行
                </button>
              ) : null}
              <button type="submit" name="notify_user" value="on" disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                {notifyOnly ? "发送通知" : "通知用户并执行"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function frontPostHref(post: AdminPostListItem) {
  const params = new URLSearchParams({ adminReturn: "/admin/user-posts" });
  return `${post.href}?${params.toString()}`;
}

function adminPostStatusLabel(status: PostStatus) {
  if (status === "published") return "显示中";
  if (status === "hidden") return "已下架";
  if (status === "pending_review") return "待审核";
  if (status === "rejected") return "已拒绝";
  if (status === "draft") return "未公开显示";
  if (status === "expired") return "已过期";
  return "已删除";
}

function postStatusCountTone(status: PostStatus): AdminCountPillItem["tone"] {
  if (status === "published") return "success";
  if (status === "pending_review") return "warning";
  if (status === "rejected") return "danger";
  return "default";
}

function adminActionLabel(action: string, templateKey?: string | null, reason?: string | null) {
  if (reason) return reason;
  if (templateKey) return templateLabel(templateKey);
  if (action === "hide_post") return "已下架";
  if (action === "approve_post") return "审核通过";
  if (action === "publish_post") return "恢复显示";
  if (action === "reject_post") return "审核拒绝";
  if (action === "delete_post") return "删除到回收站";
  if (action === "mark_post_pending_review") return "标记待审核";
  if (action === "notify_author") return "通知作者";
  return "未命名操作";
}

function templateLabel(key: string) {
  if (key === "admin_post_hidden") return "已下架";
  if (key === "admin_post_rejected") return "审核拒绝";
  if (key === "content_issue") return "内容需要修改";
  if (key === "image_issue") return "图片需要修改";
  if (key === "contact_issue") return "联系方式需要修改";
  if (key === "missing_info") return "信息需要补充";
  if (key === "wrong_category") return "分类需要修改";
  if (key === "duplicate_post") return "重复发布提醒";
  return "未命名模板";
}

function buildPageHref({ page, type, status, q, author }: { page: number; type?: string; status?: string; q?: string; author?: string }) {
  const params = new URLSearchParams();
  if (type && type !== "all") params.set("type", type);
  if (status && status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  if (author) params.set("author", author);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/user-posts?${query}` : "/admin/user-posts";
}

function getTemplate(templates: TemplateOption[], key: string) {
  return templates.find((template) => template.key === key) ?? templates[0] ?? { key, title: "", body: "" };
}

function formatDate(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
