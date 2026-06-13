import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { createDefaultNavigationCategories, deleteNavigationLink, toggleNavigationLinkFlag, upsertNavigationCategory, upsertNavigationLink } from "@/features/navigation/actions";
import type { AdminNavigationPermissions, NavigationCategory, NavigationLink } from "@/features/navigation/types";

const openModeOptions = [
  { value: "auto", label: "自动" },
  { value: "same", label: "当前窗口" },
  { value: "new", label: "新窗口" },
];

const primaryButtonClass = "inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60";
const neutralButtonClass = "inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClass = "inline-flex min-h-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60";

export function NavigationAdminPermissions({ permissions }: { permissions: AdminNavigationPermissions }) {
  return <AdminPermissionBadge allowed={permissions.manageNavigation} label="manage_navigation" />;
}

export function NavigationLinkForm({ link, category }: { link?: NavigationLink; category: NavigationCategory }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <AdminActionForm action={upsertNavigationLink} submitLabel={link ? "保存网站" : "新增网站"} submitClassName={primaryButtonClass}>
        <input type="hidden" name="id" value={link?.id ?? ""} />
        <input type="hidden" name="category_id" value={category.id ?? ""} />
        <input type="hidden" name="icon" value="" />
        <input type="hidden" name="image_url" value="" />
        <input type="hidden" name="is_featured" value="" />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="网址" name="url" defaultValue={link?.url} placeholder="https://example.com 或 /jobs" required />
          <AdminTextInput label="网站名称" name="title" defaultValue={link?.title} placeholder="例如：Google 翻译" required />
          <AdminTextInput label="说明" name="description" defaultValue={link?.description} placeholder="例如：中英文翻译、网页翻译与文档翻译。" />
          <AdminSelect label="打开方式" name="open_mode" defaultValue={link?.openMode ?? "auto"} options={openModeOptions} />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={link?.sortOrder ?? 0} />
        </div>
        <AdminCheckbox label="前台显示" name="is_active" defaultChecked={link?.isActive ?? true} />
      </AdminActionForm>
    </div>
  );
}

export function NavigationLinkAdminList({ links, categories }: { links: NavigationLink[]; categories: NavigationCategory[] }) {
  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <NavigationCategoryLinkGroup key={category.slug} category={category} links={links.filter((link) => link.categoryId === category.id || link.categorySlug === category.slug)} />
      ))}
    </div>
  );
}

function NavigationCategoryLinkGroup({ category, links }: { category: NavigationCategory; links: NavigationLink[] }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-950">{category.name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {category.slug} · {category.isActive ? "前台显示" : "已隐藏"} · 显示数量 {category.displayLimit}
          </p>
        </div>
        <details>
          <summary className="cursor-pointer rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">新增网站</summary>
          <div className="mt-3 w-full min-w-[min(720px,calc(100vw-48px))]">
            <NavigationLinkForm category={category} />
          </div>
        </details>
      </div>

      {links.length === 0 ? (
        <p className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-500">暂无网站。</p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-black text-slate-950">{link.title}</h4>
                  <p className="mt-1 break-all text-xs font-semibold text-slate-500">{link.url}</p>
                  {link.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{link.description}</p> : null}
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {link.isActive ? "显示" : "隐藏"} · {openModeLabel(link.openMode)} · 排序 {link.sortOrder}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ToggleForm link={link} field="is_active" value={!link.isActive} label={link.isActive ? "隐藏" : "显示"} />
                  <DeleteForm link={link} />
                </div>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-black text-blue-700">编辑</summary>
                <div className="mt-3">
                  <NavigationLinkForm link={link} category={category} />
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function NavigationCategoryManager({ categories }: { categories: NavigationCategory[] }) {
  return (
    <div className="space-y-4">
      <AdminActionForm action={createDefaultNavigationCategories} submitLabel="重建默认分类" submitClassName={neutralButtonClass}>
        <p className="text-sm leading-6 text-slate-600">创建或刷新热门推荐、政府服务、银行金融、购物平台、通讯网络、AI 工具、视频娱乐、社交媒体、生活服务和其它分类。</p>
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
      <AdminActionForm action={upsertNavigationCategory} submitLabel={category ? "保存分类" : "新增分类"} submitClassName={primaryButtonClass}>
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <input type="hidden" name="icon" value="" />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="名称" name="name" defaultValue={category?.name} required />
          <AdminTextInput label="Slug" name="slug" defaultValue={category?.slug} required />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={category?.sortOrder ?? 0} />
          <AdminTextInput label="前台显示数量" name="display_limit" type="number" defaultValue={category?.displayLimit ?? 50} />
        </div>
        <AdminTextInput label="说明" name="description" defaultValue={category?.description} />
        <AdminCheckbox label="前台显示" name="is_active" defaultChecked={category?.isActive ?? true} />
      </AdminActionForm>
    </div>
  );
}

function ToggleForm({ link, field, value, label }: { link: NavigationLink; field: "is_active"; value: boolean; label: string }) {
  return (
    <AdminActionForm action={toggleNavigationLinkFlag} submitLabel={label} className="contents" submitClassName={neutralButtonClass}>
      <input type="hidden" name="id" value={link.id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={value ? "true" : "false"} />
    </AdminActionForm>
  );
}

function DeleteForm({ link }: { link: NavigationLink }) {
  return (
    <AdminActionForm action={deleteNavigationLink} submitLabel="删除" className="contents" submitClassName={dangerButtonClass}>
      <input type="hidden" name="id" value={link.id} />
    </AdminActionForm>
  );
}

function openModeLabel(value: NavigationLink["openMode"]) {
  if (value === "same") return "当前窗口";
  if (value === "new") return "新窗口";
  return "自动";
}
