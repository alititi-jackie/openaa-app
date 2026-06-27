"use client";

import { AdminActionForm, AdminCheckbox } from "@/components/admin/AdminActionForm";
import { purgeDeletedNotifications } from "@/features/notifications/adminRecycleActions";
import type { DeletedNotificationsRecycleData } from "@/features/notifications/adminRecycleQueries";

export function AdminNotificationRecycleBin({ data }: { data: DeletedNotificationsRecycleData }) {
  if (data.state === "forbidden") {
    return <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">当前账号没有回收站权限。</p>;
  }

  return (
    <div className="space-y-4">
      {data.error ? <p className="rounded-xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-800">{data.error}</p> : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="已删除通知" value={data.deletedCount} />
        <Stat label="30 天前" value={data.olderThan30Count} />
        <Stat label="90 天前" value={data.olderThan90Count} />
      </div>

      <section className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <h3 className="font-black text-slate-950">清理已删除通知</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">只会永久删除用户已经删除的通知，不影响仍在用户消息中心显示的通知。</p>
        {data.superAdmin ? (
          <AdminActionForm action={purgeDeletedNotifications} submitLabel="清理已删除通知" className="mt-3 space-y-3">
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              <span>保留最近多少天</span>
              <input name="days" type="number" min={1} max={3650} step={1} defaultValue={90} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500" />
            </label>
            <AdminCheckbox name="confirm_purge_notifications" label="确认永久清理符合条件的已删除通知" />
          </AdminActionForm>
        ) : (
          <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-500">只有超级管理员可以执行清理。</p>
        )}
      </section>

      <section>
        <h3 className="font-black text-slate-950">最近删除</h3>
        {data.recentItems.length === 0 ? (
          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">暂无已删除通知。</p>
        ) : (
          <div className="mt-2 space-y-2">
            {data.recentItems.map((item) => (
              <article key={item.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <h4 className="line-clamp-2 text-sm font-black text-slate-950">{item.title}</h4>
                <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                  用户：{item.userId} · 删除时间：{formatDateTime(item.deletedAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false, timeZone: "America/New_York" });
}
