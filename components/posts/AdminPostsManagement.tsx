"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { setAdminPostStatus, type AdminPostActionState } from "@/features/posts/adminActions";
import type { AdminPostListItem, AdminPostsPermissions as AdminPostsPermissionSet } from "@/features/posts/adminQueries";
import { postStatusLabel, postStatusTone } from "@/features/posts/display";
import type { PostStatus } from "@/features/posts/types";

const postTypeOptions: Array<{ value: "all" | "jobs" | "housing" | "marketplace" | "services"; label: string }> = [
  { value: "all", label: "全部频道" },
  { value: "jobs", label: "招聘" },
  { value: "housing", label: "房屋" },
  { value: "marketplace", label: "二手" },
  { value: "services", label: "服务" },
];

const postStatusOptions: Array<{ value: PostStatus | "all"; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "draft", label: "草稿" },
  { value: "pending_review", label: "待审核" },
  { value: "published", label: "已发布" },
  { value: "hidden", label: "已下架" },
  { value: "rejected", label: "已拒绝" },
  { value: "expired", label: "已过期" },
  { value: "deleted", label: "已删除" },
];

const initialActionState: AdminPostActionState = { ok: true, message: "" };

const notifyDefaults: Partial<Record<PostStatus, { templateKey: string; title: string; body: string }>> = {
  deleted: {
    templateKey: "admin_post_deleted",
    title: "信息已被删除",
    body: "你的信息已被管理员删除并移入回收站。如有疑问，请联系网站管理员。",
  },
  rejected: {
    templateKey: "admin_post_rejected",
    title: "信息未通过审核",
    body: "你的信息未通过审核，请根据提示修改后重新提交。",
  },
};

export function AdminPostsPermissionBadges({ permissions }: { permissions: AdminPostsPermissionSet }) {
  return (
    <>
      <AdminPermissionBadge allowed={permissions.viewPosts} label="view_posts" />
      <AdminPermissionBadge allowed={permissions.moderatePosts} label="moderate_posts" />
      <AdminPermissionBadge allowed={permissions.approvePosts} label="approve_posts" />
      <AdminPermissionBadge allowed={permissions.rejectPosts} label="reject_posts" />
      <AdminPermissionBadge allowed={permissions.hidePosts} label="hide_posts" />
      <AdminPermissionBadge allowed={permissions.restorePosts} label="restore_posts" />
      <AdminPermissionBadge allowed={permissions.deletePosts} label="delete_posts" />
    </>
  );
}

export function AdminPostsFilter({ type, status, q, author }: { type?: string; status?: string; q?: string; author?: string }) {
  return (
    <form action="/admin/posts" className="grid gap-3 md:grid-cols-3">
      {author ? <input type="hidden" name="author" value={author} /> : null}
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="搜索标题或摘要"
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
      />
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
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white md:col-span-3">
        筛选帖子
      </button>
    </form>
  );
}

export function AdminPostsList({ posts, permissions }: { posts: AdminPostListItem[]; permissions: AdminPostsPermissionSet }) {
  if (posts.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无帖子记录。</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <article key={post.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{post.typeLabel}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${postStatusTone(post.status)}`}>{postStatusLabel(post.status)}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{post.visibility}</span>
              </div>
              <h3 className="mt-2 line-clamp-2 font-black text-slate-950">{post.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{post.summary}</p>
              <p className="mt-2 break-all text-xs font-semibold text-slate-500">
                作者 {post.authorId ?? "未知"} · 更新 {formatDate(post.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {post.status === "published" ? (
                <Link href={post.href} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
                  公开页
                </Link>
              ) : null}
              <StatusAction post={post} status="published" label="发布/恢复" enabled={permissions.moderatePosts} />
              <StatusAction post={post} status="hidden" label="下架" enabled={permissions.moderatePosts} />
              <StatusAction post={post} status="pending_review" label="待审核" enabled={permissions.moderatePosts} />
              <StatusAction post={post} status="rejected" label="拒绝" enabled={permissions.moderatePosts} notify />
              <StatusAction post={post} status="deleted" label="删除到回收站" enabled={permissions.moderatePosts} notify />
            </div>
          </div>
        </article>
      ))}
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

function buildPageHref({ page, type, status, q, author }: { page: number; type?: string; status?: string; q?: string; author?: string }) {
  const params = new URLSearchParams();
  if (type && type !== "all") params.set("type", type);
  if (status && status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  if (author) params.set("author", author);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/posts?${query}` : "/admin/posts";
}

function StatusAction({ post, status, label, enabled, notify = false }: { post: AdminPostListItem; status: PostStatus; label: string; enabled: boolean; notify?: boolean }) {
  if (!enabled || post.status === status) return null;

  if (notify && notifyDefaults[status]) {
    return <NotifyStatusAction post={post} status={status} label={label} />;
  }

  return (
    <AdminActionForm action={setAdminPostStatus} submitLabel={label} className="contents">
      <input type="hidden" name="id" value={post.id} />
      <input type="hidden" name="status" value={status} />
    </AdminActionForm>
  );
}

function NotifyStatusAction({ post, status, label }: { post: AdminPostListItem; status: PostStatus; label: string }) {
  const defaults = notifyDefaults[status];
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [body, setBody] = useState(defaults?.body ?? "");
  const [state, formAction, pending] = useActionState(setAdminPostStatus, initialActionState);

  if (!defaults) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <form action={formAction} className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="notification_template_key" value={defaults.templateKey} />
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
              <select name="template_preview" value={defaults.templateKey} disabled className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                <option value={defaults.templateKey}>{defaults.templateKey}</option>
              </select>
            </label>
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
              <button type="submit" disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                不通知用户，直接执行
              </button>
              <button type="submit" name="notify_user" value="on" disabled={pending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                通知用户并执行
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function formatDate(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
