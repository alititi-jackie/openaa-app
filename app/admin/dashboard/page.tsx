import Link from "next/link";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCurrentAccountCard } from "@/components/admin/AdminCurrentAccountCard";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { ADMIN_MODULES, type AdminModule } from "@/features/admin/adminModules";
import { getAdminPermissionLabel, getAdminRoleLabel } from "@/features/admins/adminRoleConfig";
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
        const moduleAccess = await getDashboardModuleAccess();
        const visibleModules = ADMIN_MODULES.filter((module) => moduleAccess.get(module.key));
        const adminEntryGroups = groupVisibleModules(visibleModules);

        return (
          <div className="space-y-4">
            <AdminTopActions />

            <AdminCurrentAccountCard displayName={user.email} role={adminRole.role} isActive={adminRole.is_active} />

            <AdminPageHeader title="OpenAA 管理后台" description="集中管理内容、用户、安全反馈和运营配置。已完成模块可直接进入，旧站已有但新站尚未补齐的模块会标记为待补齐。">
              <AdminPermissionBadge allowed={superAdmin} label="超级管理员" />
              <AdminPermissionBadge allowed={visibleModules.length > 0} label={`可进入 ${visibleModules.length}/${ADMIN_MODULES.length}`} />
              <AdminPermissionBadge allowed={adminRole.is_active} label={getAdminRoleLabel(adminRole.role)} />
            </AdminPageHeader>

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
                      <AdminEntryCard key={entry.key} entry={entry} />
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

function AdminEntryCard({ entry }: { entry: AdminModule }) {
  const Icon = entry.icon;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-950">{entry.title}</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">已授权</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={entry.href} className="inline-flex min-h-9 items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">
                进入
            </Link>
            <span className="inline-flex min-h-9 items-center rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
              {entry.permissionKeys.length > 0 ? entry.permissionKeys.map(formatPermissionLabel).join(" / ") : "模块授权"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatPermissionLabel(key: string) {
  if (key === "super_admin") return "超级管理员";
  return getAdminPermissionLabel(key);
}
