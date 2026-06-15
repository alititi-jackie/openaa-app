import { getAdminRoleLabel, getAdminStatusLabel } from "@/features/admins/adminRoleConfig";
import type { AdminRoleName } from "@/lib/supabase/types";

export function AdminCurrentAccountCard({
  displayName,
  role,
  isActive,
}: {
  displayName: string | null | undefined;
  role: AdminRoleName | string | null | undefined;
  isActive: boolean | string | null | undefined;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold text-blue-600">当前管理员</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">{displayName || "未绑定邮箱"}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">角色：{getAdminRoleLabel(role)} · 状态：{getAdminStatusLabel(isActive)}</p>
        </div>
      </div>
    </section>
  );
}
