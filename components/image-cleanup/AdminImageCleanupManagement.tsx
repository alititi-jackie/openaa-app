import Link from "next/link";
import { Image as ImageIcon, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { AdminActionForm, AdminCheckbox } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { markImageAssetDeleted } from "@/features/image-cleanup/adminActions";
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

export function AdminImageCleanupStats({ totals }: { totals: AdminImageCleanupData["totals"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <StatCard icon={<ImageIcon size={17} aria-hidden="true" />} label="图片资产" value={totals.total} />
      <StatCard icon={<Trash2 size={17} aria-hidden="true" />} label="可清理" value={totals.deletable} />
      <StatCard icon={<ShieldCheck size={17} aria-hidden="true" />} label="使用中" value={totals.protected} />
      <StatCard icon={<UploadCloud size={17} aria-hidden="true" />} label="当前页" value={totals.currentPage} />
    </div>
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
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无符合条件的图片资产。</p>;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {assets.map((asset) => (
        <article key={asset.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
              {asset.displayUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.displayUrl} alt={asset.path || asset.externalUrl || asset.id} className="h-28 w-full object-cover" />
              ) : (
                <div className="grid h-28 place-items-center text-slate-300">
                  <ImageIcon size={28} aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="min-w-0">
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
              </div>
            </div>
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

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
      <span>
        共 {totalCount} 条 · 第 {page} / {pageCount} 页
      </span>
      <div className="flex flex-wrap gap-2">
        {page > 1 ? (
          <Link href={previous} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
            上一页
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link href={next} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">
            下一页
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-black text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-blue-700">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatSize(value: number | null) {
  if (!value || value < 1) return "未记录";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDimension(width: number | null, height: number | null) {
  if (!width || !height) return "未记录";
  return `${width}×${height}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
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
