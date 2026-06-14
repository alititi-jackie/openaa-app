import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminCard } from "@/components/admin/AdminCard";
import { setTopQuickLinkInactive, upsertTopQuickLink } from "@/features/admin-home/actions";
import type { AdminTopQuickLinkRow } from "@/features/admin-home/types";

export function TopQuickLinksManagement({ topLinks }: { topLinks: AdminTopQuickLinkRow[] }) {
  return (
    <>
      <AdminCard title="新增快捷入口" description="内部链接使用 /jobs 这样的路径；外部链接必须使用 https。">
        <TopLinkForm />
      </AdminCard>

      <AdminCard title="现有快捷入口" description="支持编辑、启用/禁用和数字排序；默认城市为纽约。">
        <div className="grid gap-4">
          {topLinks.length > 0 ? topLinks.map((link) => <TopLinkForm key={link.id} link={link} />) : <p className="text-sm text-slate-500">暂无 top_quick_links 配置。</p>}
        </div>
      </AdminCard>
    </>
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
