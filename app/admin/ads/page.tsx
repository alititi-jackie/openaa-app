import { Megaphone } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { AdForm, AdminAdsFilter, AdminAdsList } from "@/components/ads/AdminAdsManagement";
import { getAdminAdsData } from "@/features/ads/adminQueries";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "广告管理",
  description: "OpenAA 后台广告位管理。",
  path: "/admin/ads",
  noIndex: true,
});

type AdminAdsPageProps = {
  searchParams?: Promise<{ placement?: string; status?: string }>;
};

export default function AdminAdsPage({ searchParams }: AdminAdsPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        if (!(await hasAdminModule("ads"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="广告管理" description="当前管理员没有广告管理模块权限。" />
            </div>
          );
        }
        const data = await getAdminAdsData(params?.placement, params?.status);

        if (!data.canManageAds) {
          return (
            <AdminPageHeader title="广告管理" description="当前管理员没有 manage_ads 权限。">
              <AdminPermissionBadge allowed={data.canManageAds} label="manage_ads" />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />
            <AdminPageHeader title="广告管理" description="管理首页和频道页广告位。图片只引用 https://img.openaa.com/ 外链，不下载、不上传。">
              <AdminPermissionBadge allowed={data.canManageAds} label="manage_ads" />
            </AdminPageHeader>

            {data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                广告后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminCard title="新增广告" description="支持 home、jobs_top、housing_top、marketplace_top、services_top、news_top、navigation_top、dmv_top 等广告位。">
              <AdForm />
            </AdminCard>

            <AdminCard title="筛选广告" description="按广告位查看当前配置。">
              <AdminAdsFilter placement={params?.placement} status={params?.status} />
            </AdminCard>

            <AdminCard title="广告列表" description="保存后会刷新首页和频道页顶部广告。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <Megaphone size={15} aria-hidden="true" />
                当前筛选共 {data.ads.length} 条广告。
              </div>
              <AdminAdsList ads={data.ads} />
            </AdminCard>
</div>
        );
      }}
    </AdminAuthGate>
  );
}
