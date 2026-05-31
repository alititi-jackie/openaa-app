import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { EmptyState } from "@/components/common/EmptyState";
import { deleteUserNavigationLink } from "@/features/navigation/actions";
import type { UserNavigationLink } from "@/features/navigation/types";
import { MyNavigationForm } from "./MyNavigationForm";

export function MyNavigationList({ links }: { links: UserNavigationLink[] }) {
  if (links.length === 0) {
    return <EmptyState title="还没有我的导航" description="添加常用站点后，会按排序显示在这里。" />;
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div key={link.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-black text-slate-950">{link.title}</h2>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">{link.url}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">排序 {link.sortOrder} · {link.openMode === "new" ? "新窗口" : "当前窗口"}</p>
            </div>
            <AdminActionForm action={deleteUserNavigationLink} submitLabel="删除" className="shrink-0">
              <input type="hidden" name="id" value={link.id} />
            </AdminActionForm>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-black text-blue-700">编辑</summary>
            <div className="mt-3">
              <MyNavigationForm link={link} />
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
