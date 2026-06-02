import Image from "next/image";
import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextInput } from "@/components/admin/AdminActionForm";
import { deleteAd, removeAdImage, upsertAd } from "@/features/ads/adminActions";
import type { AdminAdRow } from "@/features/ads/adminQueries";

const placementOptions = [
  { value: "home", label: "首页 home" },
  { value: "jobs_top", label: "招聘顶部 jobs_top" },
  { value: "housing_top", label: "房屋顶部 housing_top" },
  { value: "marketplace_top", label: "市场顶部 marketplace_top" },
  { value: "services_top", label: "服务顶部 services_top" },
  { value: "news_top", label: "新闻顶部 news_top" },
  { value: "navigation_top", label: "导航顶部 navigation_top" },
  { value: "dmv_top", label: "DMV 顶部 dmv_top" },
];

export function AdminAdsFilter({ placement, status }: { placement?: string; status?: string }) {
  return (
    <form action="/admin/ads" className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
      <select name="placement" defaultValue={placement ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        <option value="all">全部广告位</option>
        {placementOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select name="status" defaultValue={status ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        <option value="all">全部状态</option>
        <option value="active">正在显示</option>
        <option value="scheduled">未开始</option>
        <option value="expired">已过期</option>
        <option value="inactive">已停用</option>
      </select>
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        筛选广告
      </button>
    </form>
  );
}

export function AdminAdsList({ ads }: { ads: AdminAdRow[] }) {
  if (ads.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无广告配置。</p>;
  }

  return (
    <div className="space-y-4">
      {ads.map((ad) => (
        <AdForm key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

export function AdForm({ ad }: { ad?: AdminAdRow }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      {ad ? <AdStatusBadge ad={ad} /> : null}
      {ad?.image_url ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Image src={ad.image_url} alt={ad.title} width={960} height={240} className="h-32 w-full object-cover" unoptimized />
        </div>
      ) : null}
      <AdminActionForm action={upsertAd} submitLabel={ad ? "保存广告" : "新增广告"}>
        <input type="hidden" name="id" value={ad?.id ?? ""} />
        <input type="hidden" name="image_asset_id" value={ad?.image_asset_id ?? ""} />
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminSelect label="广告位" name="placement" defaultValue={ad?.placement ?? "home"} options={placementOptions} />
          <AdminTextInput label="标题" name="title" defaultValue={ad?.title} required />
          <AdminTextInput label="链接" name="href" defaultValue={ad?.href} placeholder="/navigation 或 https://example.com" />
          <AdminSelect label="打开方式" name="open_mode" defaultValue={ad?.open_mode ?? "same"} options={[{ value: "same", label: "当前窗口" }, { value: "new", label: "新窗口" }]} />
          <AdminTextInput label="图片 URL" name="image_url" defaultValue={ad?.image_source_type === "external" ? ad.image_url : ""} placeholder="https://img.openaa.com/..." />
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            <span>上传广告图</span>
            <input name="image_file" type="file" accept="image/jpeg,image/png,image/webp" className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-slate-700 focus:border-blue-500" />
            <span className="text-xs font-semibold text-slate-500">支持 JPG / PNG / WebP，最大 5MB。上传图片优先于外部 URL。</span>
          </label>
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={ad?.sort_order ?? 0} />
          <AdminTextInput label="开始时间" name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(ad?.starts_at)} />
          <AdminTextInput label="结束时间" name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(ad?.ends_at)} />
        </div>
        <AdminCheckbox label="启用" name="is_active" defaultChecked={ad?.is_active ?? true} />
      </AdminActionForm>
      {ad ? (
        <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
          {ad.image_asset_id ? (
            <AdminActionForm action={removeAdImage} submitLabel="移除图片">
              <input type="hidden" name="id" value={ad.id} />
              <p className="text-xs font-semibold leading-5 text-amber-700">只解除这条广告的图片引用，图片资产会标记为 deleted。</p>
              <AdminCheckbox label="我确认移除这张广告图" name="confirm_remove_image" />
            </AdminActionForm>
          ) : null}
          <AdminActionForm action={deleteAd} submitLabel="删除广告">
            <input type="hidden" name="id" value={ad.id} />
            <p className="text-xs font-semibold leading-5 text-red-600">删除只移除广告配置，不物理删除图片文件。</p>
            <AdminCheckbox label="我确认删除这条广告配置" name="confirm_delete" />
          </AdminActionForm>
        </div>
      ) : null}
    </div>
  );
}

function AdStatusBadge({ ad }: { ad: AdminAdRow }) {
  const labelMap: Record<AdminAdRow["computed_status"], string> = {
    active: "正在显示",
    inactive: "已停用",
    scheduled: "未开始",
    expired: "已过期",
  };
  const classMap: Record<AdminAdRow["computed_status"], string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    inactive: "bg-slate-100 text-slate-600 ring-slate-200",
    scheduled: "bg-blue-50 text-blue-700 ring-blue-100",
    expired: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-black">
      <span className={`rounded-full px-2.5 py-1 ring-1 ${classMap[ad.computed_status]}`}>{labelMap[ad.computed_status]}</span>
      <span className="rounded-full bg-white px-2.5 py-1 text-slate-500 ring-1 ring-slate-200">{ad.placement}</span>
    </div>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}
