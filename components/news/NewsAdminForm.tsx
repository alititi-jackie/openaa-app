"use client";

import Link from "next/link";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useMemo, useRef, useState, useTransition } from "react";
import { Eye, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { AdminActionForm, AdminCheckbox, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";
import { createDefaultNewsCategories, setNewsPostStatus, toggleNewsPin, upsertNewsCategory, upsertNewsPost, type NewsActionState } from "@/features/news/actions";
import { formatNewsDate } from "@/features/news/mappers";
import type { AdminNewsPermissions, AdminNewsPost, NewsCategory, NewsStatus } from "@/features/news/types";

const initialState: NewsActionState = { ok: true, message: "" };

const statusOptions: Array<{ value: NewsStatus; label: string }> = [
  { value: "draft", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "hidden", label: "已下架" },
];

const buttonBase = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50";
const neutralButtonClass = `${buttonBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const primaryButtonClass = `${buttonBase} border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100`;
const dangerButtonClass = `${buttonBase} border-red-100 bg-red-50 text-red-600 hover:bg-red-100`;

type LocalPost = AdminNewsPost & {
  transientMessage?: string;
};

type FormValues = {
  title: string;
  slug: string;
  categoryId: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  status: NewsStatus;
  publishedAt: string;
  isFeatured: boolean;
  isPinned: boolean;
  pinnedOrder: number;
  pinnedUntil: string;
  seoTitle: string;
  seoDescription: string;
};

type CoverSource = "storage" | "external" | null;

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

export function NewsAdminManager({
  posts,
  categories,
  permissions,
}: {
  posts: AdminNewsPost[];
  categories: NewsCategory[];
  permissions: AdminNewsPermissions;
}) {
  const [localPosts, setLocalPosts] = useState<LocalPost[]>(posts);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NewsStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const canRead = permissions.viewNews || permissions.createNews || permissions.editNews || permissions.publishNews || permissions.deleteNews;

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortNewsPosts(localPosts).filter((post) => {
      if (statusFilter !== "all" && post.status !== statusFilter) return false;
      if (categoryFilter !== "all" && post.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return post.title.toLowerCase().includes(q) || post.slug.toLowerCase().includes(q);
    });
  }, [categoryFilter, localPosts, query, statusFilter]);

  function upsertLocalPost(post: LocalPost) {
    setLocalPosts((current) => {
      const index = current.findIndex((item) => item.id === post.id);
      if (index < 0) return [post, ...current];
      const next = [...current];
      next[index] = { ...next[index], ...post };
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {permissions.createNews ? (
        <section className="bg-white">
          {creating ? (
            <div className="rounded-2xl border border-blue-200 bg-white p-3">
              <NewsPostEditor
                categories={categories}
                permissions={permissions}
                onCancel={() => setCreating(false)}
                onSaved={(post) => {
                  setCreating(false);
                  upsertLocalPost(post);
                }}
              />
            </div>
          ) : (
            <button type="button" onClick={() => setCreating(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100">
              <Plus size={16} aria-hidden="true" />
              新增新闻
            </button>
          )}
        </section>
      ) : null}

      {canRead ? (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">筛选新闻</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或 slug" className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as NewsStatus | "all")} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
              <option value="all">全部状态</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
              <option value="all">全部分类</option>
              {categories.flatMap((category) => (category.id ? [<option key={category.id} value={category.id}>{category.name}</option>] : []))}
            </select>
          </div>
        </section>
      ) : null}

      {canRead ? (
        <section className="bg-white">
          <h2 className="text-lg font-black text-slate-950">新闻列表</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">按前台展示顺序排列：有效置顶优先，其次置顶排序、发布时间和创建时间。</p>
        </section>
      ) : null}

      {canRead ? (
        <div className="space-y-3">
          {visiblePosts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-500">暂无符合条件的新闻。</p>
          ) : (
            visiblePosts.map((post) => (
              <NewsPostCard
                key={post.id}
                post={post}
                categories={categories}
                permissions={permissions}
                editing={editingId === post.id}
                onEdit={() => setEditingId((current) => (current === post.id ? null : post.id))}
                onCancelEdit={() => setEditingId(null)}
                onSaved={(updated) => {
                  setEditingId(null);
                  upsertLocalPost(updated);
                }}
                onPostsChange={setLocalPosts}
              />
            ))
          )}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">新闻分类</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">维护新闻分类名称、slug、启用状态和排序。</p>
        <div className="mt-4">
          <NewsCategoryManager categories={categories} canManage={permissions.manageNewsCategories} />
        </div>
      </section>
    </div>
  );
}

function NewsPostCard({
  post,
  categories,
  permissions,
  editing,
  onEdit,
  onCancelEdit,
  onSaved,
  onPostsChange,
}: {
  post: LocalPost;
  categories: NewsCategory[];
  permissions: AdminNewsPermissions;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: (post: LocalPost) => void;
  onPostsChange: Dispatch<SetStateAction<LocalPost[]>>;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function setMessage(message: string) {
    onPostsChange((current) => current.map((item) => (item.id === post.id ? { ...item, transientMessage: message } : item)));
  }

  function updateStatus(status: NewsStatus) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", post.id);
      formData.set("slug", post.slug);
      formData.set("status", status);
      const result = await setNewsPostStatus(initialState, formData);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      if (status === "deleted") {
        onPostsChange((current) => current.filter((item) => item.id !== post.id));
        setDeleteOpen(false);
        return;
      }

      onPostsChange((current) =>
        current.map((item) =>
          item.id === post.id
            ? {
                ...item,
                status,
                publishedAt: status === "published" ? new Date().toISOString() : null,
                transientMessage: result.message,
              }
            : item,
        ),
      );
    });
  }

  function updatePin() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", post.id);
      formData.set("slug", post.slug);
      formData.set("is_pinned", post.isPinned ? "false" : "true");
      const result = await toggleNewsPin(initialState, formData);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      onPostsChange((current) => current.map((item) => (item.id === post.id ? { ...item, isPinned: !post.isPinned, transientMessage: result.message } : item)));
    });
  }

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-blue-700">{post.categoryName}</p>
          <h3 className="mt-1 line-clamp-2 font-black text-slate-950">{post.title}</h3>
          <p className="mt-1 break-all text-xs font-semibold text-slate-500">/news/{post.slug}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{statusLabel(post.status)}</Badge>
            {post.isPinned ? <Badge tone="blue">置顶 {post.pinnedOrder}</Badge> : null}
            {post.isFeatured ? <Badge tone="emerald">推荐</Badge> : null}
            {post.pinnedUntil ? <Badge tone="purple">到期 {formatNewsDate(post.pinnedUntil)}</Badge> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
            <span>发布：{formatNewsDate(post.publishedAt)}</span>
            <span>更新：{formatNewsDate(post.updatedAt)}</span>
          </div>
        </div>
      </div>

      {post.transientMessage ? <p className="mt-3 text-sm font-semibold leading-6 text-emerald-700">{post.transientMessage}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {permissions.editNews ? (
          <button type="button" onClick={onEdit} className={neutralButtonClass}>
            <Pencil size={14} aria-hidden="true" />
            编辑
          </button>
        ) : null}
        {permissions.publishNews && post.status !== "published" ? (
          <button type="button" onClick={() => updateStatus("published")} disabled={pending} className={primaryButtonClass}>
            发布
          </button>
        ) : null}
        {permissions.editNews && post.status === "published" ? (
          <button type="button" onClick={() => updateStatus("hidden")} disabled={pending} className={neutralButtonClass}>
            下架
          </button>
        ) : null}
        {permissions.editNews ? (
          <button type="button" onClick={updatePin} disabled={pending} className={neutralButtonClass}>
            {post.isPinned ? <PinOff size={14} aria-hidden="true" /> : <Pin size={14} aria-hidden="true" />}
            {post.isPinned ? "取消置顶" : "置顶"}
          </button>
        ) : null}
        {post.status === "published" ? (
          <Link href={`/news/${post.slug}`} target="_blank" className={neutralButtonClass}>
            <Eye size={14} aria-hidden="true" />
            查看
          </Link>
        ) : null}
        {permissions.deleteNews ? (
          <button type="button" onClick={() => setDeleteOpen(true)} disabled={pending} className={dangerButtonClass}>
            <Trash2 size={14} aria-hidden="true" />
            删除
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-3 rounded-2xl border border-blue-200 bg-white p-3">
          <NewsPostEditor post={post} categories={categories} permissions={permissions} onCancel={onCancelEdit} onSaved={onSaved} />
        </div>
      ) : null}

      <AdminConfirmDialog
        open={deleteOpen}
        title="确认删除新闻？"
        description="删除后不会在前台显示，并会进入回收站。"
        confirmLabel="确认删除"
        cancelLabel="取消"
        tone="danger"
        pending={pending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => updateStatus("deleted")}
      />
    </article>
  );
}

function NewsPostEditor({
  post,
  categories,
  permissions,
  onCancel,
  onSaved,
}: {
  post?: AdminNewsPost;
  categories: NewsCategory[];
  permissions: AdminNewsPermissions;
  onCancel: () => void;
  onSaved: (post: LocalPost) => void;
}) {
  const [values, setValues] = useState<FormValues>(() => valuesFromPost(post, categories));
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [coverSource, setCoverSource] = useState<CoverSource>(() => post?.coverImageSource ?? (post?.coverImageUrl ? "external" : null));
  const [selectedUpload, setSelectedUpload] = useState(false);
  const [removedCover, setRemovedCover] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function setValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateTitle(title: string) {
    setValues((current) => ({
      ...current,
      title,
      slug: !post && !slugTouched ? slugFromTitle(title) : current.slug,
    }));
  }

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await upsertNewsPost(initialState, formData);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      const selectedCategory = categories.find((category) => category.id === values.categoryId);
      const nextCoverImageUrl = removedCover ? null : values.coverImageUrl || post?.coverImageUrl || null;
      onSaved({
        id: result.id ?? post?.id ?? `temp-${Date.now()}`,
        title: values.title,
        slug: values.slug,
        href: `/news/${values.slug}`,
        excerpt: values.excerpt,
        body: values.body,
        categoryId: values.categoryId || null,
        categoryName: selectedCategory?.name ?? post?.categoryName ?? "新闻",
        categorySlug: selectedCategory?.slug ?? post?.categorySlug ?? null,
        coverImageUrl: nextCoverImageUrl,
        coverImageSource: removedCover ? null : coverSource,
        coverImageAssetId: removedCover ? null : post?.coverImageAssetId ?? null,
        status: values.status,
        isFeatured: values.isFeatured,
        isPinned: values.isPinned,
        pinnedOrder: values.pinnedOrder,
        pinnedUntil: values.pinnedUntil || null,
        publishedAt: values.status === "published" ? values.publishedAt || new Date().toISOString() : values.publishedAt || null,
        updatedAt: new Date().toISOString(),
        createdAt: post?.createdAt ?? new Date().toISOString(),
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
        transientMessage: result.message,
      });
    });
  }

  return (
    <form action={save} encType="multipart/form-data" className="space-y-3">
      <input type="hidden" name="id" value={post?.id ?? ""} />
      <input type="hidden" name="cover_image_asset_id" value={removedCover ? "" : post?.coverImageAssetId ?? ""} />
      {removedCover ? <input type="hidden" name="remove_cover_image" value="on" /> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="标题" name="title" value={values.title} onChange={updateTitle} required />
        <TextField
          label="Slug"
          name="slug"
          value={values.slug}
          onChange={(value) => {
            setSlugTouched(true);
            setValue("slug", slugFromTitle(value));
          }}
          required
        />
        <SelectField label="分类" name="category_id" value={values.categoryId} onChange={(value) => setValue("categoryId", value)} options={categories.flatMap((category) => (category.id ? [{ value: category.id, label: category.name }] : []))} />
        <SelectField label="状态" name="status" value={values.status} onChange={(value) => setValue("status", value as NewsStatus)} options={statusOptions.filter((option) => option.value !== "deleted" && (option.value !== "published" || permissions.publishNews || post?.status === "published"))} />
        <TextField label="发布时间" name="published_at" type="datetime-local" value={values.publishedAt} onChange={(value) => setValue("publishedAt", value)} />
        <TextField label="置顶到期" name="pinned_until" type="datetime-local" value={values.pinnedUntil} onChange={(value) => setValue("pinnedUntil", value)} />
        <TextField label="置顶排序" name="pinned_order" type="number" min={0} value={String(values.pinnedOrder)} onChange={(value) => setValue("pinnedOrder", Math.max(0, Number(value) || 0))} />
        <TextField label="SEO title" name="seo_title" value={values.seoTitle} onChange={(value) => setValue("seoTitle", value)} />
      </div>

      <TextareaField label="摘要" name="excerpt" rows={3} value={values.excerpt} onChange={(value) => setValue("excerpt", value)} />
      <TextareaField label="正文" name="body" rows={9} value={values.body} onChange={(value) => setValue("body", value)} required />

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="text-sm font-black text-slate-800">封面图</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <TextField
            label="封面图片 URL"
            name="cover_image_url"
            value={coverSource === "storage" ? "" : values.coverImageUrl}
            onChange={(value) => {
              setValue("coverImageUrl", value);
              if (!value.trim()) setCoverSource(null);
              setRemovedCover(false);
            }}
            onBlur={() => {
              if (values.coverImageUrl.trim()) setCoverSource("external");
            }}
            placeholder="https://img.openaa.com/..."
            disabled={coverSource === "storage"}
            readOnly={coverSource === "external"}
          />
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            <span>上传封面</span>
            <input
              key={fileInputKey}
              ref={fileInputRef}
              name="cover_image_file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={coverSource === "external" || (coverSource === "storage" && !selectedUpload)}
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  setCoverSource("storage");
                  setSelectedUpload(true);
                  setRemovedCover(false);
                  setValue("coverImageUrl", "");
                }
              }}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          {coverSource === "storage"
            ? "当前使用上传图片。如需改用外部图片链接，请先移除封面。"
            : coverSource === "external"
              ? "当前使用外部图片链接。如需上传图片，请先移除封面。"
              : "上传文件支持 JPG、PNG、WebP，最大 5MB；也可以填写 https://img.openaa.com/ 图片地址。"}
        </p>
        {coverSource ? (
          <button
            type="button"
            onClick={() => {
              setCoverSource(null);
              setSelectedUpload(false);
              setRemovedCover(true);
              setValue("coverImageUrl", "");
              setFileInputKey((value) => value + 1);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl border border-red-100 bg-white px-3 py-1.5 text-xs font-black text-red-600 hover:bg-red-50"
          >
            移除封面
          </button>
        ) : null}
        {values.coverImageUrl && !removedCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={values.coverImageUrl} alt="封面预览" className="mt-3 h-28 w-full max-w-56 rounded-xl object-cover ring-1 ring-slate-100" />
        ) : null}
      </div>

      <TextareaField label="SEO description" name="seo_description" rows={3} value={values.seoDescription} onChange={(value) => setValue("seoDescription", value)} />

      <div className="flex flex-wrap gap-4">
        <CheckboxField label="推荐" name="is_featured" checked={values.isFeatured} onChange={(checked) => setValue("isFeatured", checked)} />
        <CheckboxField label="置顶" name="is_pinned" checked={values.isPinned} onChange={(checked) => setValue("isPinned", checked)} />
      </div>

      {message ? <p className="text-sm font-semibold text-red-600">{message}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={pending} className={neutralButtonClass}>
          取消
        </button>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}

export function NewsCategoryManager({ categories, canManage }: { categories: NewsCategory[]; canManage: boolean }) {
  if (!canManage) {
    return <p className="text-sm leading-6 text-slate-600">当前账号没有 {getAdminPermissionLabel("manage_news_categories")} 权限。</p>;
  }

  return (
    <div className="space-y-4">
      <AdminActionForm action={createDefaultNewsCategories} submitLabel="创建默认分类">
        <p className="text-sm leading-6 text-slate-600">创建或刷新本地新闻、新手指南、DMV 教程、生活指南、平台公告。</p>
      </AdminActionForm>
      <NewsCategoryForm />
      <div className="grid gap-3 md:grid-cols-2">
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

function TextField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  min,
  disabled = false,
  readOnly = false,
  onBlur,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  disabled?: boolean;
  readOnly?: boolean;
  onBlur?: () => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>
        {label} {required ? <span className="text-red-600">*</span> : null}
      </span>
      <input
        name={name}
        value={value}
        type={type}
        required={required}
        min={min}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 read-only:bg-slate-100"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  rows,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>
        {label} {required ? <span className="text-red-600">*</span> : null}
      </span>
      <textarea name={name} value={value} rows={rows} required={required} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500" />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <select name={name} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
      <input name={name} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
      <span>{label}</span>
    </label>
  );
}

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "blue" | "emerald" | "purple" }) {
  const className =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 ring-blue-100"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
        : tone === "purple"
          ? "bg-purple-50 text-purple-700 ring-purple-100"
          : "bg-slate-50 text-slate-600 ring-slate-100";

  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${className}`}>{children}</span>;
}

function valuesFromPost(post: AdminNewsPost | undefined, categories: NewsCategory[]): FormValues {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    categoryId: post?.categoryId ?? categories.find((category) => category.id)?.id ?? "",
    excerpt: post?.excerpt ?? "",
    body: post?.body ?? "",
    coverImageUrl: post?.coverImageUrl ?? "",
    status: post?.status ?? "draft",
    publishedAt: toDateTimeLocal(post?.publishedAt),
    isFeatured: post?.isFeatured ?? false,
    isPinned: post?.isPinned ?? false,
    pinnedOrder: post?.pinnedOrder ?? 0,
    pinnedUntil: toDateTimeLocal(post?.pinnedUntil),
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
  };
}

function sortNewsPosts(posts: LocalPost[]) {
  return [...posts].sort((a, b) => {
    if (a.status === "deleted" && b.status !== "deleted") return 1;
    if (a.status !== "deleted" && b.status === "deleted") return -1;
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.isPinned && b.isPinned && a.pinnedOrder !== b.pinnedOrder) return a.pinnedOrder - b.pinnedOrder;
    const publishedDiff = sortableTime(b.publishedAt ?? b.createdAt) - sortableTime(a.publishedAt ?? a.createdAt);
    if (publishedDiff !== 0) return publishedDiff;
    return sortableTime(b.createdAt) - sortableTime(a.createdAt);
  });
}

function statusLabel(status: NewsStatus) {
  if (status === "published") return "已发布";
  if (status === "hidden") return "已下架";
  if (status === "deleted") return "已删除";
  if (status === "pending_review") return "待审核";
  if (status === "rejected") return "已拒绝";
  if (status === "expired") return "已过期";
  return "草稿";
}

function sortableTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function slugFromTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
