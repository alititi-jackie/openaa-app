import Link from "next/link";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { AdminActionForm, AdminCheckbox } from "@/components/admin/AdminActionForm";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminBackNavigation } from "@/components/admin/AdminBackNavigation";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { permanentlyDeletePost, restoreDeletedPost } from "@/features/posts/adminActions";
import { getRecycleBinData, type RecycleBinFilter, type RecycleBinItem } from "@/features/posts/adminQueries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "删除管理",
  description: "OpenAA 后台删除管理与回收站。",
  path: "/admin/recycle-bin",
  noIndex: true,
});

const tabs: Array<{ value: RecycleBinFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "job", label: "招聘" },
  { value: "housing", label: "房屋" },
  { value: "marketplace", label: "二手" },
  { value: "service", label: "服务" },
  { value: "expired", label: "已超期" },
  { value: "image_error", label: "异常图片" },
];

type RecycleBinPageProps = {
  searchParams?: Promise<{ filter?: string }>;
};

export default function AdminRecycleBinPage({ searchParams }: RecycleBinPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const filter = normalizeFilter(params?.filter);
        const data = await getRecycleBinData(filter);

        if (!data.superAdmin) {
          return (
            <div className="space-y-4">
              <AdminBackNavigation />
              <AdminPageHeader title="删除管理" description="只有超级管理员可以访问删除管理。">
                <AdminPermissionBadge allowed={false} label="super_admin" />
              </AdminPageHeader>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <AdminBackNavigation />
              <AdminLogoutButton />
            </div>

            <AdminPageHeader title="删除管理" description="第一版只管理招聘、房屋、二手和服务四类用户发布内容。">
              <AdminPermissionBadge allowed={data.superAdmin} label="super_admin" />
            </AdminPageHeader>

            <nav aria-label="删除管理分类" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex gap-2">
                {tabs.map((tab) => (
                  <Link
                    key={tab.value}
                    href={tab.value === "all" ? "/admin/recycle-bin" : `/admin/recycle-bin?filter=${tab.value}`}
                    className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black ring-1 ${
                      data.filter === tab.value ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </nav>

            {data.error ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{data.error}</div> : null}

            <AdminCard title="健康检查" description="只显示数量，不自动批量清理。">
              <div className="grid gap-3 md:grid-cols-4">
                <HealthLink label="已软删除超过保留期" value={data.health.overdueCount} href="/admin/recycle-bin?filter=expired" />
                <HealthLink label="已删除帖子但图片仍在" value={data.health.deletedPostsWithImagesCount} href="/admin/recycle-bin" />
                <HealthLink label="图片记录可能异常" value={data.health.possibleMissingStorageCount} href="/admin/recycle-bin?filter=image_error" />
                <HealthLink label="收藏孤儿" value={data.health.orphanFavoriteCount} href="/admin/recycle-bin" />
              </div>
            </AdminCard>

            <AdminCard title="回收站列表" description="恢复会先变为隐藏状态；永久删除后不可恢复。">
              {data.items.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500">当前分类没有回收站内容。</div>
              ) : (
                <div className="space-y-3">
                  {data.items.map((item) => (
                    <RecycleBinRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </AdminCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function RecycleBinRow({ item }: { item: RecycleBinItem }) {
  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{item.typeLabel}</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">{item.status}</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{sourceLabel(item.deletedSource)}</span>
            {item.hasImageError ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                <AlertTriangle size={13} aria-hidden="true" />
                异常图片
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 line-clamp-2 font-black text-slate-950">{item.title}</h2>
          <div className="mt-2 grid gap-1 text-xs font-semibold text-slate-500 md:grid-cols-4">
            <span>删除时间：{formatDateTime(item.deletedAt)}</span>
            <span>图片数量：{item.imageCount}</span>
            <span>自动物理删除时间：{formatDateTime(item.purgeAt)}</span>
            <span className="break-all">ID：{item.id}</span>
          </div>
          {item.imageError ? <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">图片异常：{item.imageError}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={item.href} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-700 ring-1 ring-slate-200">
            查看
          </Link>
          <AdminActionForm action={restoreDeletedPost} submitLabel="恢复" className="contents" submitClassName="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white disabled:opacity-60">
            <input type="hidden" name="id" value={item.id} />
            <RotateCcw size={15} aria-hidden="true" />
          </AdminActionForm>
          <AdminActionForm action={permanentlyDeletePost} submitLabel="永久删除" className="grid gap-2 rounded-xl bg-white p-2 ring-1 ring-red-100" submitClassName="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white disabled:opacity-60">
            <input type="hidden" name="id" value={item.id} />
            <AdminCheckbox label="永久删除后不可恢复，资料、图片和相关收藏记录都会被删除。" name="confirm_permanent_delete" />
            <Trash2 size={15} aria-hidden="true" />
          </AdminActionForm>
        </div>
      </div>
    </article>
  );
}

function HealthLink({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 hover:bg-slate-100">
      <span className="block text-xs font-bold text-slate-500">{label}</span>
      <span className="mt-1 block text-2xl font-black text-slate-950">{value}</span>
    </Link>
  );
}

function normalizeFilter(value?: string): RecycleBinFilter {
  return value === "job" || value === "housing" || value === "marketplace" || value === "service" || value === "expired" || value === "image_error" ? value : "all";
}

function sourceLabel(source: RecycleBinItem["deletedSource"]) {
  if (source === "user") return "用户删除";
  if (source === "admin") return "管理员删除";
  return "未知来源";
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : date.toLocaleString("zh-CN", { hour12: false });
}
