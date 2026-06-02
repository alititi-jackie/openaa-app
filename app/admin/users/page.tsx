import { Users } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminUsersFilter, AdminUsersList, AdminUsersPagination, AdminUsersPermissionBadges } from "@/components/users/AdminUsersManagement";
import { getAdminUsersData } from "@/features/users/adminQueries";
import type { ProfileStatus } from "@/lib/supabase/types";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "用户管理",
  description: "OpenAA 后台用户管理基础。",
  path: "/admin/users",
  noIndex: true,
});

type AdminUsersPageProps = {
  searchParams?: Promise<{ status?: string; q?: string; page?: string }>;
};

export default function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const data = await getAdminUsersData({
          status: normalizeStatus(params?.status),
          q: params?.q,
          page: normalizePage(params?.page),
        });

        if (!data.permissions.viewUsers) {
          return (
            <AdminPageHeader title="用户管理" description="当前管理员没有 view_users 权限。">
              <AdminUsersPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <AdminPageHeader title="用户管理" description="查看用户资料状态，并管理 restricted / banned / active 等账号状态。">
              <AdminUsersPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                用户后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminCard title="筛选用户" description="按状态、邮箱、昵称或用户 ID 搜索。">
              <AdminUsersFilter status={params?.status} q={params?.q} />
            </AdminCard>

            <AdminCard title="用户列表" description="只更新账号状态，不删除用户，不修改 Auth 账号。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <Users size={15} aria-hidden="true" />
                默认按最近更新排序，每页显示 {data.pageSize} 位用户。
              </div>
              <AdminUsersList users={data.users} permissions={data.permissions} />
              <AdminUsersPagination page={data.page} pageCount={data.pageCount} totalCount={data.totalCount} status={params?.status} q={params?.q} />
            </AdminCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeStatus(value?: string): ProfileStatus | "all" | undefined {
  if (value === "active" || value === "restricted" || value === "banned" || value === "pending") return value;
  if (value === "all") return "all";
  return undefined;
}

function normalizePage(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}
