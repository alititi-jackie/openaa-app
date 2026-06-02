import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminSettingsPermissionBadges,
  AdminSettingsSummary,
  AdminSiteSettingsList,
  DailyPostLimitForm,
} from "@/components/settings/AdminSettingsManagement";
import { getAdminSettingsData } from "@/features/settings/adminQueries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "站点设置",
  description: "OpenAA 后台站点设置管理。",
  path: "/admin/settings",
  noIndex: true,
});

export default function AdminSettingsPage() {
  return (
    <AdminAuthGate>
      {async () => {
        const data = await getAdminSettingsData();

        if (!data.canManageSettings) {
          return (
            <AdminPageHeader title="站点设置" description="当前管理员没有 manage_settings 权限。">
              <AdminSettingsPermissionBadges canManageSettings={data.canManageSettings} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <AdminPageHeader title="站点设置" description="管理每日发帖上限等基础规则，替代旧站 Admin Token 设置页。">
              <AdminSettingsPermissionBadges canManageSettings={data.canManageSettings} />
            </AdminPageHeader>

            {data.state === "error" || data.state === "missing_config" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                站点设置读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminSettingsSummary data={data} />

            <AdminCard title="每日发布上限" description="旧站已有的基础设置：限制每个账号每天可发布的信息总数。">
              <DailyPostLimitForm dailyPostLimit={data.dailyPostLimit} />
            </AdminCard>

            <AdminCard title="当前站点设置" description="只展示 site_settings 中的当前配置，便于上线前核对域名策略、DMV 提示和后台基础规则。">
              <AdminSiteSettingsList settings={data.settings} />
            </AdminCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}
