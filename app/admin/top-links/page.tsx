import Link from "next/link";
import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { setTopQuickLinkInactive, upsertTopQuickLink } from "@/features/admin-home/actions";
import { getAdminTopLinksData } from "@/features/admin-home/queries";
import type { AdminTopQuickLinkRow } from "@/features/admin-home/types";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "顶部快捷导航管理",
  description: "OpenAA 后台顶部快捷导航管理。",
  path: "/admin/top-links",
  noIndex: true,
});

export default function AdminTopLinksPage() {
  return (
    <AdminAuthGate>
      {async () => {
        const data = await getAdminTopLinksData();

        if (!data.permissions.manageTopLinks) {
          return <AdminPageHeader title="顶部快捷导航" description="当前管理员没有 manage_top_links 权限。" />;
        }

        return (
          <div className="space-y-4">
            <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              ← 返回总后台
            </Link>

            <AdminPageHeader title="顶部快捷导航" description="管理 Header 城市入口展开后的快捷导航。">
              <AdminPermissionBadge allowed={data.permissions.manageTopLinks} label="manage_top_links" />
            </AdminPageHeader>

            <AdminCard title="新增快捷入口" description="内部链接使用 /jobs 这样的路径；外部链接必须使用 https。">
              <TopLinkForm />
            </AdminCard>

            <AdminCard title="现有快捷入口" description="支持编辑、启用/禁用和数字排序；默认城市为纽约。">
              <div className="grid gap-4">
                {data.topLinks.length > 0 ? data.topLinks.map((link) => <TopLinkForm key={link.id} link={link} />) : <p className="text-sm text-slate-500">暂无 top_quick_links 配置。</p>}
              </div>
            </AdminCard>
            <nav aria-label="后台底部导航" className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回首页
                </Link>
                <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回总后台
                </Link>
              </div>
            </nav>

          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function TopLinkForm({ link }: { link?: AdminTopQuickLinkRow }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <AdminActionForm action={upsertTopQuickLink} submitLabel={link ? "保存入口" : "新增入口"}>
        <input type="hidden" name="id" value={link?.id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="标题" name="title" defaultValue={link?.title} required />
          <AdminTextInput label="URL" name="url" defaultValue={link?.href} placeholder="/jobs" required />
          <AdminTextInput label="图标 Key" name="icon" defaultValue={link?.icon} placeholder="briefcase" />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={link?.sort_order ?? 0} />
          <AdminSelect label="打开方式" name="open_mode" defaultValue={link?.open_mode ?? "same"} options={[{ value: "same", label: "当前窗口" }, { value: "new", label: "新窗口" }]} />
        </div>
        <AdminCheckbox label="启用" name="is_active" defaultChecked={link?.is_active ?? true} />
      </AdminActionForm>
      {link ? (
        <AdminActionForm action={setTopQuickLinkInactive} submitLabel="停用入口" className="mt-3">
          <input type="hidden" name="id" value={link.id} />
        </AdminActionForm>
      ) : null}
    </div>
  );
}
