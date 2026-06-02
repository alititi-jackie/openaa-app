import Link from "next/link";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { setAdminPostStatus } from "@/features/posts/adminActions";
import type { AdminPostListItem, AdminPostsPermissions as AdminPostsPermissionSet } from "@/features/posts/adminQueries";
import { POST_STATUS_LABELS } from "@/features/posts/constants";
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

const statusTone: Record<PostStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_review: "bg-amber-50 text-amber-700",
  published: "bg-emerald-50 text-emerald-700",
  hidden: "bg-orange-50 text-orange-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-slate-100 text-slate-600",
  deleted: "bg-red-50 text-red-700",
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
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusTone[post.status]}`}>{POST_STATUS_LABELS[post.status]}</span>
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
              <StatusAction post={post} status="rejected" label="拒绝" enabled={permissions.moderatePosts} />
              <StatusAction post={post} status="deleted" label="软删除" enabled={permissions.moderatePosts} />
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

function StatusAction({ post, status, label, enabled }: { post: AdminPostListItem; status: PostStatus; label: string; enabled: boolean }) {
  if (!enabled || post.status === status) return null;

  return (
    <AdminActionForm action={setAdminPostStatus} submitLabel={label} className="contents">
      <input type="hidden" name="id" value={post.id} />
      <input type="hidden" name="status" value={status} />
    </AdminActionForm>
  );
}

function formatDate(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
