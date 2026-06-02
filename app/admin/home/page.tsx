import Link from "next/link";
import { AdminActionForm, AdminCheckbox, AdminSelect, AdminTextarea, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { createDefaultHomeConfig, updateHomeSection, updateLatestTickerSettings, upsertHomeBanner, upsertLatestTicker } from "@/features/admin-home/actions";
import { getAdminHomeConfigData } from "@/features/admin-home/queries";
import type { AdminHomeBannerRow, AdminHomeSectionRow, AdminTickerGlobalSettingsRow, AdminTickerRow, AdminTickerSectionSettingsRow } from "@/features/admin-home/types";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "首页配置管理",
  description: "OpenAA 后台首页配置管理。",
  path: "/admin/home",
  noIndex: true,
});

export default function AdminHomePage() {
  return (
    <AdminAuthGate>
      {async () => {
        const data = await getAdminHomeConfigData();
        const canManageAny = data.permissions.manageHomeSections || data.permissions.manageTopLinks || data.permissions.manageLatestTicker || data.permissions.manageAds;

        if (!canManageAny) {
          return <AdminPageHeader title="首页配置管理" description="当前管理员没有首页配置相关权限。" />;
        }

        return (
          <div className="space-y-4">
            <AdminPageHeader title="首页配置管理" description="管理首页模块、最新动态、Banner 与顶部快捷导航入口。">
              <AdminPermissionBadge allowed={data.permissions.manageHomeSections} label="manage_home_sections" />
              <AdminPermissionBadge allowed={data.permissions.manageTopLinks} label="manage_top_links" />
              <AdminPermissionBadge allowed={data.permissions.manageLatestTicker} label="manage_latest_ticker" />
              <AdminPermissionBadge allowed={data.permissions.manageAds} label="manage_ads" />
              <Link href="/admin/top-links" className="inline-flex min-h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-black text-blue-700">
                管理顶部快捷导航
              </Link>
            </AdminPageHeader>

            {data.permissions.manageHomeSections ? (
              <AdminCard title="创建默认配置" description="当新 Supabase 还没有首页配置时，可以创建一套与当前 fallback 一致的默认配置。">
                <AdminActionForm action={createDefaultHomeConfig} submitLabel="创建默认配置">
                  <p className="text-sm leading-6 text-slate-600">会写入 home_sections；如果当前账号也有对应权限，会同时写入 top_quick_links 和 latest_ticker。</p>
                </AdminActionForm>
              </AdminCard>
            ) : null}

            {data.permissions.manageHomeSections ? (
              <AdminCard title="首页模块" description="控制 quick_grid、utility_tools、latest_posts、seo_content 等模块的显隐、标题、排序和 config。">
                <div className="grid gap-4">
                  {data.homeSections.length > 0 ? data.homeSections.map((section) => <HomeSectionForm key={section.key} section={section} />) : <p className="text-sm text-slate-500">暂无 home_sections 配置，可先创建默认配置。</p>}
                </div>
              </AdminCard>
            ) : null}

            {data.permissions.manageLatestTicker ? (
              <AdminCard title="最新动态" description="管理首页单行 latest_ticker。">
                <div className="grid gap-4">
                  <TickerSettingsForm globalSettings={data.tickerGlobalSettings} sections={data.tickerSectionSettings} />
                  {data.tickerItems.map((item) => (
                    <TickerForm key={item.id} item={item} />
                  ))}
                  <TickerForm />
                </div>
              </AdminCard>
            ) : null}

            {data.permissions.manageHomeSections ? (
              <AdminCard title="首页 Banner" description="基础管理 home_banners。图片第一版支持 https://img.openaa.com/ 外部 URL。">
                <div className="grid gap-4">
                  {data.banners.map((banner) => (
                    <BannerForm key={banner.id} banner={banner} />
                  ))}
                  <BannerForm />
                </div>
              </AdminCard>
            ) : null}
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function HomeSectionForm({ section }: { section: AdminHomeSectionRow }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <AdminActionForm action={updateHomeSection} submitLabel="保存模块">
        <input type="hidden" name="key" value={section.key} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="模块 Key" name="key_display" defaultValue={section.key} />
          <AdminTextInput label="标题" name="title" defaultValue={section.title} required />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={section.sort_order} />
          <AdminTextInput label="描述" name="description" defaultValue={section.description} />
        </div>
        <AdminCheckbox label="显示模块" name="is_visible" defaultChecked={section.is_visible} />
        <AdminTextarea label="Config JSON" name="config" rows={10} defaultValue={JSON.stringify(section.config ?? {}, null, 2)} />
      </AdminActionForm>
    </div>
  );
}

function TickerSettingsForm({ globalSettings, sections }: { globalSettings: AdminTickerGlobalSettingsRow; sections: AdminTickerSectionSettingsRow[] }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
      <AdminActionForm action={updateLatestTickerSettings} submitLabel="保存滚动条设置">
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="滚动间隔（秒）" name="interval_seconds" type="number" defaultValue={globalSettings.interval_seconds} />
          <div className="flex items-end">
            <AdminCheckbox label="启用最新动态滚动条" name="global_is_enabled" defaultChecked={globalSettings.is_enabled} />
          </div>
        </div>
        <div className="grid gap-3">
          {sections.map((section) => (
            <div key={section.section_key} className="rounded-xl border border-blue-100 bg-white p-3">
              <input type="hidden" name="section_key" value={section.section_key} />
              <input type="hidden" name={`section_name_${section.section_key}`} value={section.section_name} />
              <div className="grid gap-3 md:grid-cols-[1fr_120px_120px_auto]">
                <div className="text-sm font-black text-slate-800">{section.section_name}</div>
                <AdminTextInput label="排序" name={`sort_order_${section.section_key}`} type="number" defaultValue={section.sort_order} />
                <AdminTextInput label="显示数量" name={`display_count_${section.section_key}`} type="number" defaultValue={section.display_count} />
                <div className="flex items-end">
                  <AdminCheckbox label="显示" name={`is_enabled_${section.section_key}`} defaultChecked={section.is_enabled} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminActionForm>
    </div>
  );
}

const tickerModuleOptions = [
  { value: "news", label: "新闻" },
  { value: "jobs", label: "招聘" },
  { value: "housing", label: "房屋" },
  { value: "marketplace", label: "二手 / 市场" },
  { value: "services", label: "本地服务" },
];

function TickerForm({ item }: { item?: AdminTickerRow }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <AdminActionForm action={upsertLatestTicker} submitLabel={item ? "保存动态" : "新增动态"}>
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminSelect label="模块" name="module" defaultValue={item?.module ?? "news"} options={tickerModuleOptions} />
          <AdminTextInput label="标题" name="title" defaultValue={item?.title} required />
          <AdminTextInput label="链接" name="href" defaultValue={item?.href} placeholder="/news" />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
          <AdminTextInput label="开始时间" name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(item?.starts_at)} />
          <AdminTextInput label="结束时间" name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(item?.ends_at)} />
        </div>
        <AdminCheckbox label="启用" name="is_enabled" defaultChecked={item?.is_enabled ?? true} />
      </AdminActionForm>
    </div>
  );
}

function BannerForm({ banner }: { banner?: AdminHomeBannerRow }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <AdminActionForm action={upsertHomeBanner} submitLabel={banner ? "保存 Banner" : "新增 Banner"}>
        <input type="hidden" name="id" value={banner?.id ?? ""} />
        <input type="hidden" name="image_asset_id" value={banner?.image_asset_id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <AdminTextInput label="标题" name="title" defaultValue={banner?.title} required />
          <AdminTextInput label="副标题" name="subtitle" defaultValue={banner?.subtitle} />
          <AdminTextInput label="链接" name="href" defaultValue={banner?.href} placeholder="/navigation" />
          <AdminTextInput label="图片 URL" name="image_url" defaultValue={banner?.image_url} placeholder="https://img.openaa.com/..." />
          <AdminSelect label="打开方式" name="open_mode" defaultValue={banner?.open_mode ?? "same"} options={[{ value: "same", label: "当前窗口" }, { value: "new", label: "新窗口" }]} />
          <AdminTextInput label="排序" name="sort_order" type="number" defaultValue={banner?.sort_order ?? 0} />
          <AdminTextInput label="开始时间" name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(banner?.starts_at)} />
          <AdminTextInput label="结束时间" name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(banner?.ends_at)} />
        </div>
        <AdminCheckbox label="启用" name="is_active" defaultChecked={banner?.is_active ?? true} />
      </AdminActionForm>
    </div>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}
