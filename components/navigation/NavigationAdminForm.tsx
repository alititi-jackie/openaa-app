import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextarea, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { createDefaultNavigationCategories, toggleNavigationLinkFlag, upsertNavigationCategory, upsertNavigationLink } from "@/features/navigation/actions";
import type { AdminNavigationPermissions, NavigationCategory, NavigationLink } from "@/features/navigation/types";

const openModeOptions = [
  { value: "new", label: "新窗口" },
  { value: "same", label: "当前窗口" },
];

export function NavigationAdminPermissions({ permissions }: { permissions: AdminNavigationPermissions }) {
  return <AdminPermissionBadge allowed={permissions.manageNavigation} label="manage_navigation" />;
}

export function NavigationLinkForm({ link, categories }: { link?: NavigationLink; categories: NavigationCategory[] }) {
  const categoryOptions = [{ value: "", label: "未分类" }, ...categories.flatMap((category) => category.id ? [{ value: category.id, label: category.name }] : [])];

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <AdminActionForm action={upsertNavigationLink} submitLabel={link ? "保存链接" : "新增链接"}>
        <input type="hidden" name="id" value={link?.id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="标题" name="title" defaultValue={link?.title} required />
          <AdminTextInput label="URL" name="url" defaultValue={link?.url} placeholder="https://example.com 或 /news" required />
          <AdminSelect label="分类" name="category_id" defaultValue={link?.categoryId ?? ""} options={categoryOptions} />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={link?.sortOrder ?? 0} />
          <AdminTextInput label="图标文字" name="icon" defaultValue={link?.icon} placeholder="DMV" />
          <AdminSelect label="打开方式" name="open_mode" defaultValue={link?.openMode ?? "new"} options={openModeOptions} />
        </div>
        <AdminTextInput label="图片 URL" name="image_url" defaultValue={link?.imageUrl} placeholder="https://img.openaa.com/..." />
        <AdminTextarea label="描述" name="description" rows={3} defaultValue={link?.description} />
        <div className="flex flex-wrap gap-4">
          <AdminCheckbox label="启用" name="is_active" defaultChecked={link?.isActive ?? true} />
          <AdminCheckbox label="推荐" name="is_featured" defaultChecked={link?.isFeatured ?? false} />
        </div>
      </AdminActionForm>
    </div>
  );
}

export function NavigationLinkAdminList({ links, categories }: { links: NavigationLink[]; categories: NavigationCategory[] }) {
  if (links.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无导航链接。</p>;
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div key={link.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-700">{link.categoryName}</p>
              <h3 className="mt-1 font-black text-slate-950">{link.title}</h3>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">{link.url}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {link.isActive ? "启用" : "停用"} · {link.isFeatured ? "推荐" : "普通"} · 排序 {link.sortOrder}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ToggleForm link={link} field="is_active" value={!link.isActive} label={link.isActive ? "停用" : "启用"} />
              <ToggleForm link={link} field="is_featured" value={!link.isFeatured} label={link.isFeatured ? "取消推荐" : "推荐"} />
            </div>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-black text-blue-700">编辑</summary>
            <div className="mt-3">
              <NavigationLinkForm link={link} categories={categories} />
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}

export function NavigationCategoryManager({ categories }: { categories: NavigationCategory[] }) {
  return (
    <div className="space-y-4">
      <AdminActionForm action={createDefaultNavigationCategories} submitLabel="创建默认分类">
        <p className="text-sm leading-6 text-slate-600">创建或刷新常用网站、政府办事、DMV / 驾照、交通出行、生活服务、华人社区。</p>
      </AdminActionForm>
      <NavigationCategoryForm />
      <div className="grid gap-3">
        {categories.map((category) => (
          <NavigationCategoryForm key={category.slug} category={category} />
        ))}
      </div>
    </div>
  );
}

function NavigationCategoryForm({ category }: { category?: NavigationCategory }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <AdminActionForm action={upsertNavigationCategory} submitLabel={category ? "保存分类" : "新增分类"}>
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="名称" name="name" defaultValue={category?.name} required />
          <AdminTextInput label="Slug" name="slug" defaultValue={category?.slug} required />
          <AdminTextInput label="图标文字" name="icon" defaultValue={category?.icon} />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={category?.sortOrder ?? 0} />
        </div>
        <AdminTextInput label="描述" name="description" defaultValue={category?.description} />
        <AdminCheckbox label="启用" name="is_active" defaultChecked={category?.isActive ?? true} />
      </AdminActionForm>
    </div>
  );
}

function ToggleForm({ link, field, value, label }: { link: NavigationLink; field: "is_active" | "is_featured"; value: boolean; label: string }) {
  return (
    <AdminActionForm action={toggleNavigationLinkFlag} submitLabel={label} className="contents">
      <input type="hidden" name="id" value={link.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={value ? "true" : "false"} />
    </AdminActionForm>
  );
}
