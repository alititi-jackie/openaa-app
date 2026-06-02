import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextInput } from "@/components/admin/AdminActionForm";
import { upsertAd } from "@/features/ads/adminActions";
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

export function AdminAdsFilter({ placement }: { placement?: string }) {
  return (
    <form action="/admin/ads" className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <select name="placement" defaultValue={placement ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        <option value="all">全部广告位</option>
        {placementOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
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
      <AdminActionForm action={upsertAd} submitLabel={ad ? "保存广告" : "新增广告"}>
        <input type="hidden" name="id" value={ad?.id ?? ""} />
        <input type="hidden" name="image_asset_id" value={ad?.image_asset_id ?? ""} />
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminSelect label="广告位" name="placement" defaultValue={ad?.placement ?? "home"} options={placementOptions} />
          <AdminTextInput label="标题" name="title" defaultValue={ad?.title} required />
          <AdminTextInput label="链接" name="href" defaultValue={ad?.href} placeholder="/navigation 或 https://example.com" />
          <AdminSelect label="打开方式" name="open_mode" defaultValue={ad?.open_mode ?? "same"} options={[{ value: "same", label: "当前窗口" }, { value: "new", label: "新窗口" }]} />
          <AdminTextInput label="图片 URL" name="image_url" defaultValue={ad?.image_url} placeholder="https://img.openaa.com/..." />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={ad?.sort_order ?? 0} />
          <AdminTextInput label="开始时间" name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(ad?.starts_at)} />
          <AdminTextInput label="结束时间" name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(ad?.ends_at)} />
        </div>
        <AdminCheckbox label="启用" name="is_active" defaultChecked={ad?.is_active ?? true} />
      </AdminActionForm>
    </div>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}
