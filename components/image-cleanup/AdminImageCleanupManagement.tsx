"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Image as ImageIcon, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { AdminActionForm, AdminCheckbox } from "@/components/admin/AdminActionForm";
import { AdminCollapsibleCard } from "@/components/admin/AdminCollapsibleCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { markImageAssetDeleted, purgeDeletedImageAsset } from "@/features/image-cleanup/adminActions";
import type { AdminImageAssetItem, AdminImageCleanupData, ImageCleanupFilter, ImageSourceFilter } from "@/features/image-cleanup/adminQueries";

const filterOptions: Array<{ value: ImageCleanupFilter; label: string }> = [
  { value: "deletable", label: "可清理" },
  { value: "protected", label: "使用中" },
  { value: "deleted", label: "已删除" },
  { value: "all", label: "全部" },
];

const sourceOptions: Array<{ value: ImageSourceFilter; label: string }> = [
  { value: "all", label: "全部来源" },
  { value: "storage", label: "Storage" },
  { value: "external", label: "外部图片" },
];

export function AdminImageCleanupPermissionBadges({ permissions }: { permissions: AdminImageCleanupData["permissions"] }) {
  return (
    <>
      <AdminPermissionBadge allowed={permissions.viewImages || permissions.manageImageAssets} label="view_images" />
      <AdminPermissionBadge allowed={permissions.manageImageAssets} label="manage_image_assets" />
      <AdminPermissionBadge allowed={permissions.deleteImages} label="delete_images" />
    </>
  );
}

export function AdminImageCleanupHealthSection({ totals, activeFilter }: { totals: AdminImageCleanupData["totals"]; activeFilter: ImageCleanupFilter }) {
  return (
    <AdminCollapsibleCard title="健康检查" className="p-4" titleClassName="text-lg" contentClassName="mt-4 border-t-0 p-0 pt-0">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<ImageIcon size={17} aria-hidden="true" />} label="图片资产" value={totals.total} href="/admin/image-cleanup?filter=all" active={activeFilter === "all"} />
        <StatCard icon={<Trash2 size={17} aria-hidden="true" />} label="可清理" value={totals.deletable} href="/admin/image-cleanup" active={activeFilter === "deletable"} />
        <StatCard icon={<ShieldCheck size={17} aria-hidden="true" />} label="使用中" value={totals.protected} href="/admin/image-cleanup?filter=protected" active={activeFilter === "protected"} />
        <StatCard icon={<UploadCloud size={17} aria-hidden="true" />} label="当前页" value={totals.currentPage} href={imageCleanupFilterHref(activeFilter)} active={false} />
      </div>
    </AdminCollapsibleCard>
  );
}

export function AdminImageCleanupFilter({ filter, source, q }: { filter?: string; source?: string; q?: string }) {
  return (
    <form action="/admin/image-cleanup" className="grid gap-3 md:grid-cols-4">
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="搜索图片 ID、路径、外链、实体 ID"
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-4"
      />
      <select name="filter" defaultValue={filter ?? "deletable"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        {filterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select name="source" defaultValue={source ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-2">
        {sourceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        扫描图片
      </button>
    </form>
  );
}

export function AdminImageAssetsList({ assets, canDelete }: { assets: AdminImageAssetItem[]; canDelete: boolean }) {
  if (assets.length === 0) {
    return <AdminEmptyState title="暂无符合条件的图片资产。" compact align="left" />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => (
        <article key={asset.id} className="flex min-h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
            {asset.displayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.displayUrl} alt={asset.path || asset.externalUrl || asset.id} className="aspect-[4/3] max-h-52 w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] max-h-52 place-items-center text-slate-300">
                <ImageIcon size={32} aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="mt-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${asset.isProbablyUnused ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                {asset.status === "deleted" ? "已删除" : asset.isProbablyUnused ? "疑似未使用" : "使用中"}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${riskClassName(asset.cleanupRisk)}`}>{riskLabel(asset.cleanupRisk)}</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">{asset.sourceType}</span>
              {asset.isPublic ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">公开</span> : null}
            </div>
            <h3 className="mt-2 break-all text-sm font-black text-slate-950">{asset.path || asset.externalUrl || asset.id}</h3>
            <div className="mt-2 grid gap-1 break-all text-xs font-semibold text-slate-500">
              <span>ID：{asset.id}</span>
              <span>引用状态：{asset.referenceLabels.length ? asset.referenceLabels.join(" / ") : "未发现业务引用"}</span>
              {asset.protectionReasons.length ? <span>保护原因：{asset.protectionReasons.join("；")}</span> : null}
              <span>大小：{formatSize(asset.sizeBytes)} · 尺寸：{formatDimension(asset.width, asset.height)}</span>
              <span>创建：{formatDateTime(asset.createdAt)} · 更新：{formatDateTime(asset.updatedAt)}</span>
              {asset.deletedAt ? <span>删除标记：{formatDateTime(asset.deletedAt)}</span> : null}
            </div>
            <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold leading-5 ${asset.isProbablyUnused ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              {asset.cleanupHint}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {asset.displayUrl ? (
              <a href={asset.displayUrl} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
                打开图片
              </a>
            ) : null}
            {asset.isProbablyUnused && canDelete ? (
              <AdminActionForm action={markImageAssetDeleted} submitLabel="标记删除" className="grid gap-2">
                <input type="hidden" name="id" value={asset.id} />
                <AdminCheckbox label="我确认这张图片未被业务使用，只标记记录为 deleted" name="confirm_cleanup" />
              </AdminActionForm>
            ) : null}
            {asset.status === "deleted" && asset.sourceType === "storage" && asset.bucket && asset.path && canDelete ? (
              <AdminActionForm
                action={purgeDeletedImageAsset}
                submitLabel="彻底清理 Storage"
                className="grid gap-2 rounded-xl bg-white p-2 ring-1 ring-red-100"
                submitClassName="inline-flex min-h-9 items-center justify-center rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black text-white"
              >
                <input type="hidden" name="id" value={asset.id} />
                <AdminCheckbox label="确认删除 Storage 文件和图片资产记录" name="confirm_purge_image" />
              </AdminActionForm>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminImageCleanupPagination({
  page,
  pageCount,
  totalCount,
  filter,
  source,
  q,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  filter?: string;
  source?: string;
  q?: string;
}) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), filter, source, q });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), filter, source, q });

  return <AdminPagination page={page} pageCount={pageCount} totalCount={totalCount} previousHref={previous} nextHref={next} ariaLabel="图片清理分页" />;
}

function StatCard({ icon, label, value, href, active }: { icon: ReactNode; label: string; value: number; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-xl p-3 ring-1 transition ${
        active ? "bg-blue-50 text-blue-900 ring-blue-200" : "bg-slate-50 text-slate-950 ring-slate-100 hover:bg-slate-100"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-black text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-blue-700">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </Link>
  );
}

function imageCleanupFilterHref(filter: ImageCleanupFilter) {
  return filter === "deletable" ? "/admin/image-cleanup" : `/admin/image-cleanup?filter=${filter}`;
}

function formatSize(value: number | null) {
  if (!value || value < 1) return "未记录";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDimension(width: number | null, height: number | null) {
  if (!width || !height) return "未记录";
  return `${width}x${height}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function riskLabel(value: AdminImageAssetItem["cleanupRisk"]) {
  if (value === "protected") return "受保护";
  if (value === "low") return "低风险";
  return "需谨慎";
}

function riskClassName(value: AdminImageAssetItem["cleanupRisk"]) {
  if (value === "protected") return "bg-emerald-50 text-emerald-700";
  if (value === "low") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

function buildPageHref({ page, filter, source, q }: { page: number; filter?: string; source?: string; q?: string }) {
  const params = new URLSearchParams();
  if (filter && filter !== "deletable") params.set("filter", filter);
  if (source && source !== "all") params.set("source", source);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/image-cleanup?${query}` : "/admin/image-cleanup";
}
