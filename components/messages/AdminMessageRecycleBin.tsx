import { AdminActionForm, AdminCheckbox } from "@/components/admin/AdminActionForm";
import { permanentlyDeleteMessageRecycleItem, restoreMessageRecycleItem } from "@/features/messages/recycleActions";
import type { MessageRecycleData } from "@/features/messages/recycleQueries";

export function MessageRecycleBinList({ data }: { data: MessageRecycleData }) {
  if (data.items.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">当前没有已删除内容。</p>;
  }

  return (
    <div className="space-y-3">
      {data.items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">已删除</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{item.subtitle}</span>
              </div>
              <h3 className="mt-2 line-clamp-2 font-black text-slate-950">{item.title}</h3>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-black text-blue-700">查看内容</summary>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm leading-6 text-slate-700">{item.content}</p>
              </details>
              <p className="mt-2 text-xs font-semibold text-slate-500">删除时间：{formatDateTime(item.deletedAt)} · ID：{item.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminActionForm action={restoreMessageRecycleItem} submitLabel="恢复" className="contents" submitClassName="inline-flex min-h-9 items-center rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="type" value={data.type} />
              </AdminActionForm>
              {data.superAdmin ? (
                <AdminActionForm action={permanentlyDeleteMessageRecycleItem} submitLabel="永久删除" className="grid gap-2 rounded-xl bg-white p-2 ring-1 ring-red-100" submitClassName="inline-flex min-h-9 items-center justify-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="type" value={data.type} />
                  <AdminCheckbox name="confirm_permanent_delete" label="确认永久删除" />
                </AdminActionForm>
              ) : (
                <p className="max-w-[220px] rounded-xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-500 ring-1 ring-slate-200">
                  永久删除仅限超级管理员。
                </p>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false });
}
