import Link from "next/link";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCurrentAccountCard } from "@/components/admin/AdminCurrentAccountCard";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { ADMIN_MODULES, type AdminModule } from "@/features/admin/adminModules";
import { getAdminPermissionLabel, getAdminRoleLabel } from "@/features/admins/adminRoleConfig";
import { getSiteAnalyticsSummary, type SiteAnalyticsSummary } from "@/features/analytics/adminQueries";
import { getMessageCenterPendingCounts, type MessageCenterPendingCounts } from "@/features/messages/pendingCounts";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { hasAdminModule, isSuperAdmin } from "@/lib/permissions/admin";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "后台 Dashboard",
  description: "OpenAA 后台管理入口。",
  path: "/admin/dashboard",
  noIndex: true,
});

type AdminEntryGroup = {
  title: string;
  description: string;
  entries: AdminModule[];
};

const groupOrder = ["content", "users-security", "operations"] as const;

export default function AdminDashboardPage() {
  return (
    <AdminAuthGate>
      {async ({ user, adminRole }) => {
        const superAdmin = await isSuperAdmin();
        const [moduleAccess, messageCounts, analyticsSummary] = await Promise.all([
          getDashboardModuleAccess(),
          getMessageCenterPendingCounts(),
          getSiteAnalyticsSummary(),
        ]);
        const visibleModules = ADMIN_MODULES.filter((module) => moduleAccess.get(module.key));
        const adminEntryGroups = groupVisibleModules(visibleModules);

        return (
          <div className="space-y-4">
            <AdminTopActions />

            <AdminCurrentAccountCard displayName={null} email={user.email} role={adminRole.role} isActive={adminRole.is_active} />

            <AdminPageHeader title="OpenAA 管理后台" description="集中管理内容、用户、安全反馈和运营配置。已完成模块可直接进入，旧站已有但新站尚未补齐的模块会标记为待补齐。">
              <AdminPermissionBadge allowed={superAdmin} label="超级管理员" />
              <AdminPermissionBadge allowed={visibleModules.length > 0} label={`可进入 ${visibleModules.length}/${ADMIN_MODULES.length}`} />
              <AdminPermissionBadge allowed={adminRole.is_active} label={getAdminRoleLabel(adminRole.role)} />
            </AdminPageHeader>

            <SiteAnalyticsCard summary={analyticsSummary} />

            {adminEntryGroups.length > 0 ? (
              <div className="space-y-5">
                {adminEntryGroups.map((group) => (
                <section key={group.title} className="space-y-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{group.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{group.description}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.entries.map((entry) => (
                      <AdminEntryCard key={entry.key} entry={entry} messageCounts={entry.key === "messages" ? messageCounts : null} />
                    ))}
                  </div>
                </section>
                ))}
              </div>
            ) : (
              <section className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-semibold leading-6 text-slate-500 shadow-sm">
                当前账号尚未被授予可进入的后台模块，请联系超级管理员调整功能授权。
              </section>
            )}
</div>
        );
      }}
    </AdminAuthGate>
  );
}

async function getDashboardModuleAccess() {
  const results = await Promise.all(ADMIN_MODULES.map(async (module) => [module.key, await hasAdminModule(module.key)] as const));
  return new Map(results);
}

function groupVisibleModules(modules: AdminModule[]): AdminEntryGroup[] {
  return groupOrder
    .map((group) => {
      const entries = modules.filter((module) => module.group === group);
      const first = entries[0];
      return first
        ? {
            title: first.groupTitle,
            description: first.groupDescription,
            entries,
          }
        : null;
    })
    .filter((group): group is AdminEntryGroup => Boolean(group));
}

function SiteAnalyticsCard({ summary }: { summary: SiteAnalyticsSummary }) {
  const stats = [
    { label: "今日访问人数", value: summary.todayVisitors },
    { label: "今日浏览量", value: summary.todayViews },
    { label: "今日登录用户", value: summary.todayLogins },
    { label: "当前在线", value: summary.activeVisitors },
    { label: "今日新增用户", value: summary.todayNewUsers },
    { label: "总用户数", value: summary.totalUsers },
  ];

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">访问概览</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">统计前台页面访问，不包含后台、API 和系统静态资源。</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">最近 7 天访客 {summary.sevenDayVisitors}</span>
      </div>

      {summary.state === "error" || summary.state === "missing_config" ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold leading-6 text-amber-800">
          {summary.error ?? "访问统计暂时不可用。"}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
            <p className="text-xs font-bold text-slate-500">{item.label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-slate-950">热门页面 Top 10</h3>
          <span className="text-xs font-bold text-slate-500">最近 7 天</span>
        </div>
        {summary.popularPages.length > 0 ? (
          <ol className="mt-3 grid gap-2">
            {summary.popularPages.map((page, index) => (
              <li key={page.path} className="grid gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-100 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-900">
                    {index + 1}. {page.title ?? page.path}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{page.path}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black text-slate-600">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">PV {page.views}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">UV {page.visitors}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-500">暂无前台访问记录。</p>
        )}
      </div>
    </section>
  );
}

function AdminEntryCard({ entry, messageCounts }: { entry: AdminModule; messageCounts?: MessageCenterPendingCounts | null }) {
  const Icon = entry.icon;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 sm:h-11 sm:w-11">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-black text-slate-950">{entry.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:font-medium sm:leading-6">{entry.description}</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700 sm:px-2.5 sm:py-1 sm:text-xs">已授权</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 sm:mt-3">
            <Link href={entry.href} className="inline-flex min-h-8 items-center justify-center rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white hover:bg-slate-800 sm:min-h-9 sm:py-2">
              进入
            </Link>
            <span className="hidden min-h-9 items-center rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 sm:inline-flex">
              {entry.permissionKeys.length > 0 ? entry.permissionKeys.map(formatPermissionLabel).join(" / ") : "模块授权"}
            </span>
          </div>
          {messageCounts ? (
            <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-2 sm:mt-3 sm:pt-3">
              <PendingCountBadge label="举报" value={messageCounts.reports} />
              <PendingCountBadge label="线索与建议" value={messageCounts.feedback} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function PendingCountBadge({ label, value }: { label: string; value: number }) {
  const active = value > 0;
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-100">
      <span>{label}</span>
      <span className={`text-[15px] leading-none ${active ? "text-red-600" : "text-slate-900"}`}>{value}</span>
    </span>
  );
}

function formatPermissionLabel(key: string) {
  if (key === "super_admin") return "超级管理员";
  return getAdminPermissionLabel(key);
}
