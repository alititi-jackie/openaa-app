import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { AdminAdsManagement } from "@/components/ads/AdminAdsManagement";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";
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
  searchParams?: Promise<{ position?: string; placement?: string; status?: string }>;
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
        const data = await getAdminAdsData(params?.position ?? params?.placement, params?.status);

        if (!data.canManageAds) {
          return (
            <AdminPageHeader title="广告管理" description={`当前管理员没有 ${getAdminPermissionLabel("manage_ads")} 权限。`}>
              <AdminPermissionBadge allowed={data.canManageAds} label="manage_ads" />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />
            <AdminPageHeader title="广告管理" description="管理首页和频道页广告，支持内部详情页和外部链接。">
              <AdminPermissionBadge allowed={data.canManageAds} label="manage_ads" />
            </AdminPageHeader>

            {data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                广告后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminAdsManagement ads={data.ads} activePosition={data.activePosition} activeStatus={data.activeStatus} />
</div>
        );
      }}
    </AdminAuthGate>
  );
}
