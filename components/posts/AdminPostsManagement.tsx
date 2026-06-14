"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { sendAdminPostAuthorNotification, setAdminPostStatus, type AdminPostActionState } from "@/features/posts/adminActions";
import type { AdminPostListItem, AdminPostsPermissions as AdminPostsPermissionSet } from "@/features/posts/adminQueries";
import { POST_TYPE_LABELS, PUBLIC_POST_TYPES } from "@/features/posts/constants";
import { postStatusTone } from "@/features/posts/display";
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

const notificationTemplates: TemplateOption[] = [
  {
    key: "admin_post_deleted",
    title: "信息已被删除",
    body: "因收到用户反馈、举报或平台审核发现问题，你的信息已被删除并移入回收站。如有疑问，请联系网站管理员。",
  },
  {
    key: "admin_post_hidden",
    title: "信息已被下架",
    body: "因收到用户反馈、举报或平台审核发现问题，你的信息已被下架，当前不会公开显示。如有疑问，请联系网站管理员。",
  },
  {
    key: "admin_post_restored",
    title: "信息已恢复",
    body: "你的已删除信息已由管理员恢复。当前状态为未上架，如需重新公开显示，请进入我的发布，点击恢复显示或重新上架。",
  },
  { key: "admin_post_published", title: "信息已恢复显示", body: "你的信息已恢复公开显示，用户现在可以正常查看。" },
  { key: "admin_post_rejected", title: "信息未通过审核", body: "因内容不符合平台发布要求，你的信息未通过审核，请根据提示修改后重新提交。" },
  { key: "content_issue", title: "内容需要修改", body: "你的信息内容存在问题，请修改后重新提交。" },
  { key: "image_issue", title: "图片需要修改", body: "你的信息图片存在问题，请更换图片后重新提交。" },
  { key: "contact_issue", title: "联系方式需要修改", body: "你的联系方式可能不完整或格式不正确，请修改后重新提交。" },
  { key: "missing_info", title: "信息需要补充", body: "你的信息内容不够完整，请补充必要信息后重新提交。" },
  { key: "wrong_category", title: "分类需要修改", body: "你的发布内容分类可能选择不正确，请重新选择合适的分类后再上架。" },
  { key: "duplicate_post", title: "重复发布提醒", body: "你的信息可能存在重复发布，请保留一条有效信息，避免影响展示。" },
  { key: "system_announcement", title: "平台通知", body: "这是一条平台通知，请进入通知中心查看详情。" },
  { key: "account_notice", title: "账号提醒", body: "你的账号或资料需要注意，请进入个人中心查看并处理。" },
];

const statusTemplateDefaults: Partial<Record<PostStatus, string>> = {
  published: "admin_post_published",
  hidden: "admin_post_hidden",
  rejected: "admin_post_rejected",
  deleted: "admin_post_deleted",
};

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

export function AdminPostsList({ posts, permissions }: { posts: AdminPostListItem[]; permissions: AdminPostsPermissionSet }) {
  if (posts.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无用户发布信息。</p>;
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
            <PostListActions post={post} permissions={permissions} />
          </div>
        </article>
      ))}
    </div>
  );
}

function PostListActions({ post, permissions }: { post: AdminPostListItem; permissions: AdminPostsPermissionSet }) {
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-start gap-2 md:w-auto md:max-w-xs md:items-end">
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <AdminActionButton href={frontPostHref(post)} variant="neutral">查看</AdminActionButton>
        <AdminActionButton href={`/admin/user-posts/${post.id}`} variant="info">详情</AdminActionButton>
        {permissions.moderatePosts ? (
          <AdminActionButton onClick={() => setManageOpen((value) => !value)} variant="primary" aria-expanded={manageOpen}>
            管理
          </AdminActionButton>
        ) : null}
      </div>
      {manageOpen ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-slate-100 md:justify-end">
          <StatusAction post={post} status="published" label={post.status === "pending_review" ? "审核通过" : "恢复显示"} enabled={permissions.moderatePosts} />
          <StatusAction post={post} status="hidden" label="下架" enabled={permissions.moderatePosts} />
          <StatusAction post={post} status="rejected" label="审核拒绝" enabled={permissions.moderatePosts} />
          <StatusAction post={post} status="deleted" label="删除到回收站" enabled={permissions.moderatePosts} />
          <NotifyAuthorAction post={post} enabled={permissions.moderatePosts} />
        </div>
      ) : null}
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

function StatusAction({ post, status, label, enabled }: { post: AdminPostListItem; status: PostStatus; label: string; enabled: boolean }) {
  if (!enabled || post.status === status) return null;
  const templateKey = statusTemplateDefaults[status];
  if (!templateKey) return null;
  return <AdminPostNotifyAction action={setAdminPostStatus} post={post} status={status} label={label} defaultTemplateKey={templateKey} variant={statusActionVariant(status)} />;
}

function NotifyAuthorAction({ post, enabled }: { post: AdminPostListItem; enabled: boolean }) {
  if (!enabled) return null;
  return <AdminPostNotifyAction action={sendAdminPostAuthorNotification} post={post} label="通知作者" defaultTemplateKey="content_issue" notifyOnly variant="info" />;
}

export function AdminPostNotifyAction({
  action,
  post,
  status,
  label,
  defaultTemplateKey,
  variant = "primary",
  notifyOnly = false,
}: {
  action: (state: AdminPostActionState, formData: FormData) => Promise<AdminPostActionState>;
  post: NotificationPostRef;
  status?: PostStatus;
  label: string;
  defaultTemplateKey: string;
  variant?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  notifyOnly?: boolean;
}) {
  const defaultTemplate = getTemplate(defaultTemplateKey);
  const [open, setOpen] = useState(false);
  const [templateKey, setTemplateKey] = useState(defaultTemplate.key);
  const [title, setTitle] = useState(defaultTemplate.title);
  const [body, setBody] = useState(defaultTemplate.body);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const selectedTemplate = useMemo(() => getTemplate(templateKey), [templateKey]);

  function handleTemplateChange(nextKey: string) {
    const nextTemplate = getTemplate(nextKey);
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
                {notificationTemplates.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.title} · {template.key}
                  </option>
                ))}
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

function statusActionVariant(status: PostStatus) {
  if (status === "published") return "success";
  if (status === "hidden") return "warning";
  if (status === "deleted" || status === "rejected") return "danger";
  return "primary";
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
  return action;
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
  return key;
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

function getTemplate(key: string) {
  return notificationTemplates.find((template) => template.key === key) ?? notificationTemplates[0];
}

function formatDate(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
