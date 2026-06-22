import { Users } from "lucide-react";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminAlert } from "@/components/admin/AdminAlert";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { AdminUsersFilter, AdminUsersList, AdminUsersPagination, AdminUsersPermissionBadges, AdminUsersStats } from "@/components/users/AdminUsersManagement";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";
import { getAdminUsersData } from "@/features/users/adminQueries";
import { hasAdminModule } from "@/lib/permissions/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ProfileStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "用户管理",
  description: "OpenAA 后台用户管理基础。",
  path: "/admin/users",
  noIndex: true,
});

type AdminUsersPageProps = {
  searchParams?: Promise<{ status?: string; accountType?: string; q?: string; page?: string }>;
};

export default function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;

        if (!(await hasAdminModule("users"))) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="用户管理" description="查看用户资料状态，并管理账号状态。" />
              <AdminAccessDenied title="无权限" message="当前管理员没有用户管理模块权限。" permission="users" />
            </div>
          );
        }

        const data = await getAdminUsersData({
          status: normalizeStatus(params?.status),
          accountType: normalizeAccountType(params?.accountType),
          q: params?.q,
          page: normalizePage(params?.page),
        });

        if (!data.permissions.viewUsers) {
          return (
            <div className="space-y-4">
              <AdminTopActions />
              <AdminPageHeader title="用户管理" description="查看用户资料状态，并管理账号状态。">
                <AdminUsersPermissionBadges permissions={data.permissions} />
              </AdminPageHeader>
              <AdminAccessDenied title="无权限" message={`当前管理员没有 ${getAdminPermissionLabel("view_users")} 权限。`} permission="view_users" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <AdminTopActions />
            <AdminPageHeader title="用户管理" description="查看用户资料状态，并管理受限、封禁、启用等账号状态。">
              <AdminUsersPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" ? <AdminAlert>用户后台读取暂时不可用：{data.error ?? "请稍后再试。"}</AdminAlert> : null}

            <AdminUsersStats totals={data.totals} />

            <AdminFilterBar title="筛选用户" description="按状态、账号类型、邮箱、昵称、联系方式或用户 ID 搜索。">
              <AdminUsersFilter status={params?.status} accountType={params?.accountType} q={params?.q} canSearchContacts={data.permissions.viewUserContacts} />
            </AdminFilterBar>

            <AdminListCard
              title="用户列表"
              description="只更新账号状态，不删除用户，不修改 Auth 账号。"
              meta={
                <>
                  <Users size={15} aria-hidden="true" />
                  <span>默认按最近更新排序，每页显示 {data.pageSize} 位用户。</span>
                </>
              }
            >
              <AdminUsersList users={data.users} permissions={data.permissions} currentAdminId={data.currentAdminId} />
              <AdminUsersPagination page={data.page} pageCount={data.pageCount} totalCount={data.totalCount} status={params?.status} accountType={params?.accountType} q={params?.q} />
            </AdminListCard>
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

function normalizeAccountType(value?: string): "all" | "personal" | "business" | undefined {
  if (value === "personal" || value === "business" || value === "all") return value;
  return undefined;
}

function normalizePage(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}
