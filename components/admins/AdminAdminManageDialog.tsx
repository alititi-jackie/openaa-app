"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminActionForm, AdminTextInput } from "@/components/admin/AdminActionForm";
import { setAdminRoleActive, updateAdminRole } from "@/features/admins/adminActions";
import { adminRoleLabels, adminRoleOptions } from "@/features/admins/adminRoleConfig";
import type { AdminRoleListItem, AdminsPermissions } from "@/features/admins/adminQueries";
import type { AdminRoleName } from "@/lib/supabase/types";

export function AdminAdminManageDialog({ admin, permissions }: { admin: AdminRoleListItem; permissions: AdminsPermissions }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canUpdate = permissions.editAdminRoles || permissions.manageAdmins || permissions.superAdmin;
  const canDisable = permissions.disableAdmins || permissions.manageAdmins || permissions.superAdmin;
  const canRestore = permissions.restoreAdmins || permissions.manageAdmins || permissions.superAdmin;
  const superAdminLocked = admin.role === "super_admin" && !permissions.superAdmin;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <AdminActionButton onClick={() => setOpen(true)} variant="primary" className="shrink-0">
        管理
      </AdminActionButton>

      {open ? (
        <dialog ref={dialogRef} onClose={() => setOpen(false)} className="w-[min(92vw,720px)] rounded-2xl p-0 shadow-2xl backdrop:bg-slate-950/40">
          <div className="max-h-[86vh] overflow-y-auto bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">管理员管理</p>
                <h2 className="mt-1 truncate text-lg font-black text-slate-950">{admin.nickname || admin.email || "未命名管理员"}</h2>
                <p className="mt-1 break-all text-xs font-mono text-slate-400">{admin.userId}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" aria-label="关闭">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

          <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-2">
            <Info label="当前状态" value={admin.isActive ? "启用" : "停用"} />
            <Info label="当前角色" value={formatRoleLabel(admin.role)} />
            <Info label="授权时间" value={formatDateTime(admin.grantedAt)} />
            <Info label="最近后台登录" value={formatDateTime(admin.lastAdminLoginAt)} />
          </div>

          {admin.note ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black text-slate-400">当前备注</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{admin.note}</p>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <p className="text-sm font-black text-slate-950">权限说明</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              修改角色、停用和恢复管理员都会影响后台访问权限，必须输入 CONFIRM 完成二次确认。不能停用或降级最后一个启用的 super_admin，也不能修改或停用自己的管理员账号。
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            <section className="rounded-xl border border-slate-100 p-3">
              <h3 className="text-sm font-black text-slate-950">修改角色和备注</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">保存后会写入审计日志。</p>
              {canUpdate && !superAdminLocked ? (
                <AdminActionForm action={updateAdminRole} submitLabel="确认修改" className="mt-3 grid gap-2">
                  <input type="hidden" name="role_id" value={admin.id} />
                  <RoleSelect name="role" defaultValue={admin.role} allowSuperAdmin={permissions.superAdmin} />
                  <AdminTextInput label="备注" name="note" defaultValue={admin.note} />
                  <ConfirmInput />
                </AdminActionForm>
              ) : (
                <DisabledReason reason={superAdminLocked ? "只有 super_admin 可以修改 super_admin" : "没有 edit_admin_roles 或 manage_admins 权限"} />
              )}
            </section>

            <section className="rounded-xl border border-slate-100 p-3">
              <h3 className="text-sm font-black text-slate-950">{admin.isActive ? "停用管理员" : "恢复管理员"}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{admin.isActive ? "停用后该账号不能继续使用后台权限。" : "恢复后该账号可重新使用对应后台权限。"}</p>
              {superAdminLocked ? (
                <DisabledReason reason="只有 super_admin 可以停用或恢复 super_admin" />
              ) : admin.isActive && canDisable ? (
                <AdminActionForm action={setAdminRoleActive} submitLabel="确认停用" className="mt-3 grid gap-2">
                  <input type="hidden" name="role_id" value={admin.id} />
                  <input type="hidden" name="active" value="false" />
                  <ConfirmInput />
                </AdminActionForm>
              ) : !admin.isActive && canRestore ? (
                <AdminActionForm action={setAdminRoleActive} submitLabel="确认恢复" className="mt-3 grid gap-2">
                  <input type="hidden" name="role_id" value={admin.id} />
                  <input type="hidden" name="active" value="true" />
                  <ConfirmInput />
                </AdminActionForm>
              ) : (
                <DisabledReason reason={admin.isActive ? "没有 disable_admins 或 manage_admins 权限" : "没有 restore_admins 或 manage_admins 权限"} />
              )}
            </section>
          </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2">
      <span className="shrink-0 font-bold text-slate-700">{label}</span>
      <span className="min-w-0 truncate text-right text-slate-600">{value}</span>
    </div>
  );
}

function RoleSelect({ name, defaultValue, allowSuperAdmin }: { name: string; defaultValue: AdminRoleName; allowSuperAdmin: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>角色</span>
      <select name={name} defaultValue={defaultValue} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        {adminRoleOptions.map((option) => (
          <option key={option.value} value={option.value} disabled={option.value === "super_admin" && !allowSuperAdmin}>
            {formatRoleLabel(option.value)}
            {option.value === "super_admin" && !allowSuperAdmin ? "（仅 super_admin）" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConfirmInput() {
  return <AdminTextInput label="二次确认：请输入 CONFIRM" name="confirm" placeholder="CONFIRM" required />;
}

function DisabledReason({ reason }: { reason: string }) {
  return <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">不可操作：{reason}</p>;
}

function formatRoleLabel(role: AdminRoleName) {
  return `${adminRoleLabels[role]}（${role}）`;
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
