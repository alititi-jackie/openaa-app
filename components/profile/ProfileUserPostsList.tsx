import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { ProfileUserPostManagementActions } from "@/components/profile/ProfileUserPostManagementActions";
import { POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { PostCardView, PostStatus } from "@/features/posts/types";

const statusStyles: Record<PostStatus, string> = {
  draft: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100",
  pending_review: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  published: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  hidden: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100",
  rejected: "bg-red-50 text-red-600 ring-1 ring-red-100",
  expired: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100",
  deleted: "bg-red-50 text-red-600 ring-1 ring-red-100",
};

const editableStatuses = new Set<PostStatus>(["draft", "pending_review", "published", "expired"]);

function statusLabel(status?: PostStatus) {
  if (status === "published") return "显示中";
  if (status === "hidden") return "已隐藏";
  if (status === "deleted") return "已删除";
  if (status === "pending_review") return "待审核";
  if (status === "draft") return "草稿";
  if (status === "rejected") return "已拒绝";
  if (status === "expired") return "已过期";
  return "";
}

function fieldValue(post: PostCardView, label: string) {
  return post.fields.find((field) => field.label === label)?.value ?? "";
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function modeLabel(post: PostCardView) {
  if (post.type === "job") return post.mode === "seeking" ? "求职" : "招聘";
  if (post.type === "housing") return post.mode === "demand" ? "求租" : "出租";
  if (post.type === "marketplace") return post.mode === "buying" ? "求购" : "出售";
  return "";
}

function modeBadgeClass(post: PostCardView) {
  if (post.type === "job") return post.mode === "seeking" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  if (post.type === "housing") return post.mode === "demand" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  if (post.type === "marketplace") return post.mode === "buying" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
  return "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100";
}

function secondaryTag(post: PostCardView) {
  if (post.type === "job") return fieldValue(post, "类型");
  if (post.type === "housing") return fieldValue(post, "房型");
  if (post.type === "marketplace") return post.tag;
  if (post.type === "service") return post.tag;
  return "";
}

function priceText(post: PostCardView) {
  if (post.type === "job") return fieldValue(post, "薪资") || "薪资电议";
  if (post.type === "marketplace") return fieldValue(post, "价格") || "价格面议";
  return fieldValue(post, "价格");
}

function areaText(post: PostCardView) {
  if (post.type === "job") return fieldValue(post, "区域") || post.location || "";
  if (post.type === "housing") return fieldValue(post, "区域") || post.location || "";
  if (post.type === "marketplace") return fieldValue(post, "交易区域") || post.location || "";
  if (post.type === "service") return fieldValue(post, "区域") || post.location || "";
  return post.location || "";
}

function metaItems(post: PostCardView) {
  const date = formatDate(post.createdAt) || post.meta;
  const price = priceText(post);
  const area = areaText(post);
  const items: string[] = [];

  if (price) items.push(`💰 ${price}`);
  if (area) items.push(`📍 ${area}`);
  if (date) items.push(`🕘 ${date}`);

  return items;
}

export function ProfileUserPostsList({ posts }: { posts: PostCardView[] }) {
  if (posts.length === 0) {
    return <EmptyState title="暂无发布" description="这里会显示你自己的草稿、待审核、显示中和其它状态信息。" />;
  }

  return (
    <section className="space-y-4">
      {posts.map((post) => {
        const mode = modeLabel(post);
        const tag = secondaryTag(post);
        const status = statusLabel(post.status);

        return (
          <article key={post.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="max-w-[260px] truncate text-base font-semibold text-gray-900 sm:max-w-[520px]">{post.title}</h2>
                  {post.status && status ? <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[post.status]}`}>{status}</span> : null}
                  {mode ? <span className={`rounded-full px-2 py-0.5 text-xs ${modeBadgeClass(post)}`}>{mode}</span> : null}
                  {tag ? <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-100">{tag}</span> : null}
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {metaItems(post).map((item) => (
                    <span key={`${post.id}-${item}`}>{item}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href={post.href} className="rounded-lg bg-white px-3 py-2 text-center text-sm text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50">
                查看
              </Link>
              {post.status && editableStatuses.has(post.status) ? (
                <Link href={`${POST_TYPE_TO_ROUTE[post.type]}/edit/${post.id}`} className="rounded-lg bg-white px-3 py-2 text-center text-sm text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50">
                  编辑
                </Link>
              ) : null}
              <ProfileUserPostManagementActions postId={post.id} status={post.status} />
            </div>
          </article>
        );
      })}
    </section>
  );
}
