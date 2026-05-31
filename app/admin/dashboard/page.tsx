import { Database, FileText, Shield, Users } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { hasAdminPermission, isSuperAdmin } from "@/lib/permissions/admin";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "后台 Dashboard",
  description: "OpenAA 后台 Dashboard 占位。",
  path: "/admin/dashboard",
  noIndex: true,
});

export default function AdminDashboardPage() {
  return (
    <AdminAuthGate>
      {async ({ user, adminRole }) => {
        const [superAdmin, canViewUsers, canViewSettings, canViewAuditLogs] = await Promise.all([
          isSuperAdmin(),
          hasAdminPermission("view_users"),
          hasAdminPermission("view_settings"),
          hasAdminPermission("view_admin_audit_logs"),
        ]);

        return (
          <div className="space-y-4">
            <AdminPageHeader title="后台 Dashboard" description="Phase 3 只建立后台身份和权限检查基础。">
              <AdminPermissionBadge allowed={superAdmin} label="super_admin" />
              <AdminPermissionBadge allowed={canViewUsers} label="view_users" />
              <AdminPermissionBadge allowed={canViewSettings} label="view_settings" />
              <AdminPermissionBadge allowed={canViewAuditLogs} label="view_admin_audit_logs" />
            </AdminPageHeader>

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">当前管理员</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <InfoRow label="邮箱" value={user.email ?? "未绑定邮箱"} />
                <InfoRow label="角色" value={adminRole.role} />
                <InfoRow label="权限状态" value={adminRole.is_active ? "active" : "inactive"} />
              </dl>
            </section>

            <section className="grid gap-3">
              <AdminModule icon={<Users size={18} />} title="用户与资料" description="后续 Phase 接入用户列表和状态管理。" />
              <AdminModule icon={<FileText size={18} />} title="内容审核" description="后续 Phase 接入发布内容审核，不在本阶段实现。" />
              <AdminModule icon={<Database size={18} />} title="系统设置" description="后续 Phase 接入配置和运营设置。" />
              <AdminModule icon={<Shield size={18} />} title="审计日志" description="后续 Phase 接入 admin_audit_logs 查看。" />
            </section>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
      <dt className="shrink-0 font-bold text-slate-700">{label}</dt>
      <dd className="min-w-0 truncate text-right text-slate-600">{value}</dd>
    </div>
  );
}

function AdminModule({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-700">{icon}</div>
      <div>
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
