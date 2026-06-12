import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminCandidates,
  AdminRolePagination,
  AdminRolePermissionBadges,
  AdminRoleSearch,
  AdminRoleStats,
  AdminRolesList,
  CurrentAdminCapabilityPanel,
} from "@/components/admins/AdminRoleManagement";
import { getAdminsData, normalizeAdminRole, normalizeAdminStatus } from "@/features/admins/adminQueries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "管理员授权",
  description: "OpenAA 后台管理员授权管理。",
  path: "/admin/admins",
  noIndex: true,
});

type AdminAdminsPageProps = {
  searchParams?: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
};

export default function AdminAdminsPage({ searchParams }: AdminAdminsPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const data = await getAdminsData({
          q: params?.q,
          role: normalizeAdminRole(params?.role),
          status: normalizeAdminStatus(params?.status),
          page: normalizePage(params?.page),
        });
        const canView = data.permissions.viewAdmins || data.permissions.manageAdmins;

        if (!canView) {
          return (
            <AdminPageHeader title="管理员授权" description="当前管理员没有 view_admins 或 manage_admins 权限。">
              <AdminRolePermissionBadges permissions={data.permissions} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              ← 返回总后台
            </Link>

            <AdminPageHeader title="管理员授权" description="先搜索真实用户，确认 user id 后再授权后台角色。所有授权、改角色、停用和恢复都需要二次确认。">
              <AdminRolePermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" || data.state === "missing_config" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                管理员授权读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <CurrentAdminCapabilityPanel data={data} />
            <AdminRoleStats admins={data.admins} />

            <AdminCard title="搜索真实用户" description="授权前必须先查到 profiles 中真实存在的用户，避免输错邮箱写入脏记录。">
              <AdminRoleSearch q={params?.q} role={params?.role} status={params?.status} />
            </AdminCard>

            <AdminCard title="候选用户" description="从搜索结果中确认 user id 后，再选择角色授权。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <UserPlus size={15} aria-hidden="true" />
                授权 admin / super_admin 等高权限角色前，请再次核对邮箱和 user id。
              </div>
              <AdminCandidates candidates={data.candidates} permissions={data.permissions} />
            </AdminCard>

            <AdminCard title="管理员列表" description="支持改角色、停用和恢复。不能停用或降级最后一个 active super_admin。">
              <AdminRolesList admins={data.admins} permissions={data.permissions} />
              <AdminRolePagination page={data.page} pageCount={data.pageCount} totalCount={data.totalCount} q={params?.q} role={params?.role} status={params?.status} />
            </AdminCard>
            <nav aria-label="后台底部导航" className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回首页
                </Link>
                <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回总后台
                </Link>
              </div>
            </nav>

          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizePage(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}
