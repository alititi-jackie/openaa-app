import { AdminActionForm, AdminSelect, AdminTextInput } from "@/components/admin/AdminActionForm";
import { upsertUserNavigationLink } from "@/features/navigation/actions";
import type { UserNavigationLink } from "@/features/navigation/types";

const openModeOptions = [
  { value: "new", label: "新窗口" },
  { value: "same", label: "当前窗口" },
];

export function MyNavigationForm({ link }: { link?: UserNavigationLink }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <AdminActionForm action={upsertUserNavigationLink} submitLabel={link ? "保存我的导航" : "添加我的导航"}>
        <input type="hidden" name="id" value={link?.id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="标题" name="title" defaultValue={link?.title} required />
          <AdminTextInput label="链接" name="url" defaultValue={link?.url} placeholder="https://example.com 或 /news" required />
          <AdminTextInput label="图标文字" name="icon" defaultValue={link?.icon} placeholder="DMV" />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={link?.sortOrder ?? 0} />
          <AdminSelect label="打开方式" name="open_mode" defaultValue={link?.openMode ?? "new"} options={openModeOptions} />
        </div>
      </AdminActionForm>
    </div>
  );
}
