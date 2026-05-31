import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextarea, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { createDefaultNewsCategories, setNewsPostStatus, toggleNewsPin, upsertNewsCategory, upsertNewsPost } from "@/features/news/actions";
import { formatNewsDate } from "@/features/news/mappers";
import type { AdminNewsPermissions, AdminNewsPost, NewsCategory, NewsStatus } from "@/features/news/types";

const statusOptions: Array<{ value: NewsStatus; label: string }> = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "hidden", label: "已下架" },
  { value: "deleted", label: "已删除" },
];

export function NewsAdminPermissions({ permissions }: { permissions: AdminNewsPermissions }) {
  return (
    <>
      <AdminPermissionBadge allowed={permissions.viewNews} label="view_news" />
      <AdminPermissionBadge allowed={permissions.createNews} label="create_news" />
      <AdminPermissionBadge allowed={permissions.editNews} label="edit_news" />
      <AdminPermissionBadge allowed={permissions.publishNews} label="publish_news" />
      <AdminPermissionBadge allowed={permissions.deleteNews} label="delete_news" />
      <AdminPermissionBadge allowed={permissions.manageNewsCategories} label="manage_news_categories" />
    </>
  );
}

export function NewsPostForm({
  post,
  categories,
  canPublish,
}: {
  post?: AdminNewsPost;
  categories: NewsCategory[];
  canPublish: boolean;
}) {
  const actionLabel = post ? "保存新闻" : "新增新闻";
  const categoryOptions = [{ value: "", label: "未分类" }, ...categories.map((category) => ({ value: category.id ?? "", label: category.name }))];
  const statusHelpText = canPublish ? "可直接保存为已发布。" : "没有 publish_news 权限时，保存为已发布会被服务端拒绝。";

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <AdminActionForm action={upsertNewsPost} submitLabel={actionLabel}>
        <input type="hidden" name="id" value={post?.id ?? ""} />
        <input type="hidden" name="cover_image_asset_id" value={post?.coverImageAssetId ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="标题" name="title" defaultValue={post?.title} required />
          <AdminTextInput label="Slug" name="slug" defaultValue={post?.slug} placeholder="ny-dmv-guide" required />
          <AdminSelect label="分类" name="category_id" defaultValue={post?.categoryId ?? ""} options={categoryOptions} />
          <AdminSelect label="状态" name="status" defaultValue={post?.status ?? "draft"} options={statusOptions} />
          <AdminTextInput label="发布时间" name="published_at" type="datetime-local" defaultValue={toDateTimeLocal(post?.publishedAt)} />
          <AdminTextInput label="置顶截止" name="pinned_until" type="datetime-local" defaultValue={toDateTimeLocal(post?.pinnedUntil)} />
          <AdminTextInput label="SEO title" name="seo_title" defaultValue={post?.seoTitle} />
          <AdminTextInput label="SEO description" name="seo_description" defaultValue={post?.seoDescription} />
        </div>
        <AdminTextInput label="封面图片 URL" name="cover_image_url" defaultValue={post?.coverImageUrl} placeholder="https://img.openaa.com/..." />
        <AdminTextarea label="摘要" name="excerpt" rows={3} defaultValue={post?.excerpt} />
        <AdminTextarea label="正文" name="body" rows={8} defaultValue={post?.body} />
        <p className="text-xs font-semibold text-slate-500">{statusHelpText}</p>
        <div className="flex flex-wrap gap-4">
          <AdminCheckbox label="推荐" name="is_featured" defaultChecked={post?.isFeatured ?? false} />
          <AdminCheckbox label="置顶" name="is_pinned" defaultChecked={post?.isPinned ?? false} />
        </div>
      </AdminActionForm>
    </div>
  );
}

export function NewsPostAdminList({ posts, permissions, categories }: { posts: AdminNewsPost[]; permissions: AdminNewsPermissions; categories: NewsCategory[] }) {
  if (posts.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无新闻记录。</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div key={post.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-700">{post.categoryName}</p>
              <h3 className="mt-1 line-clamp-2 font-black text-slate-950">{post.title}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {post.status} · {formatNewsDate(post.publishedAt)} · /news/{post.slug}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {permissions.publishNews ? <StatusForm post={post} status="published" label="发布" /> : null}
              {permissions.editNews ? <StatusForm post={post} status="hidden" label="下架" /> : null}
              {permissions.editNews ? <PinForm post={post} /> : null}
              {permissions.deleteNews ? <StatusForm post={post} status="deleted" label="软删除" /> : null}
            </div>
          </div>
          {permissions.editNews ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-black text-blue-700">编辑</summary>
              <div className="mt-3">
                <NewsPostForm post={post} categories={categories} canPublish={permissions.publishNews} />
              </div>
            </details>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function NewsCategoryManager({ categories, canManage }: { categories: NewsCategory[]; canManage: boolean }) {
  if (!canManage) {
    return <p className="text-sm leading-6 text-slate-600">当前账号没有 manage_news_categories 权限。</p>;
  }

  return (
    <div className="space-y-4">
      <AdminActionForm action={createDefaultNewsCategories} submitLabel="创建默认分类">
        <p className="text-sm leading-6 text-slate-600">创建或刷新本地新闻、新手指南、DMV 教程、生活指南、平台公告。</p>
      </AdminActionForm>
      <NewsCategoryForm />
      <div className="grid gap-3">
        {categories.map((category) => (
          <NewsCategoryForm key={category.slug} category={category} />
        ))}
      </div>
    </div>
  );
}

function NewsCategoryForm({ category }: { category?: NewsCategory }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <AdminActionForm action={upsertNewsCategory} submitLabel={category ? "保存分类" : "新增分类"}>
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="名称" name="name" defaultValue={category?.name} required />
          <AdminTextInput label="Slug" name="slug" defaultValue={category?.slug} required />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={category?.sortOrder ?? 0} />
          <AdminTextInput label="描述" name="description" defaultValue={category?.description} />
        </div>
        <AdminCheckbox label="启用" name="is_active" defaultChecked={category?.isActive ?? true} />
      </AdminActionForm>
    </div>
  );
}

function StatusForm({ post, status, label }: { post: AdminNewsPost; status: NewsStatus; label: string }) {
  if (post.status === status) return null;

  return (
    <AdminActionForm action={setNewsPostStatus} submitLabel={label} className="contents">
      <input type="hidden" name="id" value={post.id} />
      <input type="hidden" name="slug" value={post.slug} />
      <input type="hidden" name="status" value={status} />
    </AdminActionForm>
  );
}

function PinForm({ post }: { post: AdminNewsPost }) {
  return (
    <AdminActionForm action={toggleNewsPin} submitLabel={post.isPinned ? "取消置顶" : "置顶"} className="contents">
      <input type="hidden" name="id" value={post.id} />
      <input type="hidden" name="slug" value={post.slug} />
      <input type="hidden" name="is_pinned" value={post.isPinned ? "false" : "true"} />
    </AdminActionForm>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}
