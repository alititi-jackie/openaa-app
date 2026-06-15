"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminActionForm, AdminTextInput } from "@/components/admin/AdminActionForm";
import { ADMIN_MODULES, type AdminModuleKey } from "@/features/admin/adminModules";
import { setAdminRoleActive, updateAdminRole } from "@/features/admins/adminActions";
import {
  adminExemptionOptions,
  adminRoleDefaultModules,
  adminRoleDescriptions,
  adminRoleOptions,
  getAdminRoleLabel,
  getAdminStatusLabel,
  type AdminExemptionKey,
} from "@/features/admins/adminRoleConfig";
import type { AdminRoleListItem, AdminsPermissions } from "@/features/admins/adminQueries";
import type { AdminRoleName } from "@/lib/supabase/types";

export function AdminAdminManageDialog({ admin, permissions }: { admin: AdminRoleListItem; permissions: AdminsPermissions }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRoleName>(admin.role);
  const [selectedModules, setSelectedModules] = useState<AdminModuleKey[]>(admin.moduleKeys);
  const [selectedExemptions, setSelectedExemptions] = useState<AdminExemptionKey[]>(admin.exemptionKeys);
  const canUpdate = permissions.editAdminRoles || permissions.manageAdmins || permissions.superAdmin;
  const canDisable = permissions.disableAdmins || permissions.manageAdmins || permissions.superAdmin;
  const canRestore = permissions.restoreAdmins || permissions.manageAdmins || permissions.superAdmin;
  const superAdminLocked = admin.role === "super_admin" && !permissions.superAdmin;
  const selfLocked = admin.isCurrentUser;

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

  const closeAfterSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  function openDialog() {
    setSelectedRole(admin.role);
    setSelectedModules(admin.moduleKeys);
    setSelectedExemptions(admin.exemptionKeys);
    setOpen(true);
  }

  function onRoleChange(role: AdminRoleName) {
    setSelectedRole(role);
    setSelectedModules(adminRoleDefaultModules[role]);
    setSelectedExemptions(role === "super_admin" ? adminExemptionOptions.map((option) => option.key) : []);
  }

  function toggleModule(moduleKey: AdminModuleKey) {
    setSelectedModules((current) => current.includes(moduleKey) ? current.filter((key) => key !== moduleKey) : [...current, moduleKey]);
  }

  function toggleExemption(exemptionKey: AdminExemptionKey) {
    setSelectedExemptions((current) => current.includes(exemptionKey) ? current.filter((key) => key !== exemptionKey) : [...current, exemptionKey]);
  }

  return (
    <>
      <AdminActionButton onClick={openDialog} variant="primary" className="shrink-0">
        管理
      </AdminActionButton>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-3 py-6 backdrop-blur-sm" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="管理员权限管理"
            className="flex max-h-[85vh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">管理员管理</p>
                <h2 className="mt-1 truncate text-lg font-black text-slate-950">{admin.nickname || admin.email || "未命名管理员"}</h2>
                <p className="mt-1 break-all text-xs font-mono text-slate-400">{admin.userId}</p>
              </div>
              <button type="button" onClick={closeDialog} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" aria-label="关闭">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

          <div className="overflow-y-auto p-5">
          <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-2">
            <Info label="当前状态" value={getAdminStatusLabel(admin.isActive)} />
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
            <p className="text-sm font-black text-slate-950">危险提示</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              管理员权限调整会立即影响该账号可进入的后台功能，请确认角色、功能授权和限制豁免均无误。必须输入 CONFIRM 完成二次确认。不能停用或降级最后一个启用的超级管理员，也不能修改或停用自己的管理员账号。
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            <section className="rounded-xl border border-slate-100 p-3">
              <h3 className="text-sm font-black text-slate-950">权限调整</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">保存后会写入审计日志，并以实际功能授权为准。</p>
              {canUpdate && !superAdminLocked && !selfLocked ? (
                <AdminActionForm
                  action={updateAdminRole}
                  submitLabel="确认调整权限"
                  className="mt-3 grid gap-4"
                  footerClassName="sticky bottom-0 -mx-3 -mb-3 flex flex-col gap-2 border-t border-slate-100 bg-white/95 p-3 backdrop-blur sm:flex-row sm:justify-end"
                  footerStart={<CancelButton onClick={closeDialog} />}
                  onSuccess={closeAfterSuccess}
                >
                  <input type="hidden" name="role_id" value={admin.id} />
                  <section className="rounded-xl bg-slate-50 p-3">
                    <RoleSelect name="role" value={selectedRole} allowSuperAdmin={permissions.superAdmin} onChange={onRoleChange} />
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">选择管理员的岗位名称。系统会自动套用推荐功能授权，之后可以手动调整。</p>
                    <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600">{adminRoleDescriptions[selectedRole]}</p>
                  </section>

                  <section className="rounded-xl bg-slate-50 p-3">
                    <h4 className="text-sm font-black text-slate-950">功能授权</h4>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">选择该管理员可以进入和处理的后台功能。未勾选的功能不会显示在后台首页，也不能通过链接直接访问。</p>
                    <div className="mt-3 grid gap-2">
                      {selectedRole === "super_admin"
                        ? ADMIN_MODULES.map((module) => <input key={module.key} type="hidden" name="module_keys" value={module.key} />)
                        : null}
                      {ADMIN_MODULES.map((module) => {
                        const checked = selectedRole === "super_admin" || selectedModules.includes(module.key);
                        const disabled = selectedRole === "super_admin" || Boolean(module.superAdminOnly);
                        return (
                          <label key={module.key} className={`grid gap-1 rounded-xl border px-3 py-2 text-sm ${checked ? "border-blue-100 bg-white" : "border-slate-100 bg-white/60"}`}>
                            <span className="flex items-start gap-2 font-bold text-slate-800">
                              <input
                                name={disabled ? undefined : "module_keys"}
                                type="checkbox"
                                value={module.key}
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleModule(module.key)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300"
                              />
                              <span>
                                {module.title}
                                {module.superAdminOnly ? <span className="ml-2 text-xs font-black text-blue-600">仅超级管理员</span> : null}
                              </span>
                            </span>
                            {module.children?.length ? <span className="pl-6 text-xs font-semibold leading-5 text-slate-500">包含：{module.children.map((child) => child.title).join(" / ")}</span> : null}
                          </label>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-xl bg-slate-50 p-3">
                    <h4 className="text-sm font-black text-slate-950">限制豁免</h4>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">只用于跳过网站已有的个别普通用户限制。未勾选时按普通用户规则执行。</p>
                    <div className="mt-3 grid gap-2">
                      {selectedRole === "super_admin"
                        ? adminExemptionOptions.map((option) => <input key={option.key} type="hidden" name="exemption_keys" value={option.key} />)
                        : null}
                      {adminExemptionOptions.map((option) => {
                        const checked = selectedRole === "super_admin" || selectedExemptions.includes(option.key);
                        const disabled = selectedRole === "super_admin";
                        return (
                          <label key={option.key} className="grid gap-1 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm">
                            <span className="flex items-start gap-2 font-bold text-slate-800">
                              <input
                                name={disabled ? undefined : "exemption_keys"}
                                type="checkbox"
                                value={option.key}
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleExemption(option.key)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300"
                              />
                              {option.label}
                            </span>
                            <span className="pl-6 text-xs font-semibold leading-5 text-slate-500">{option.description}</span>
                          </label>
                        );
                      })}
                    </div>
                  </section>

                  <AdminTextInput label="备注" name="note" defaultValue={admin.note} />
                  <ConfirmInput />
                </AdminActionForm>
              ) : (
                <DisabledReason reason={selfLocked ? "不能修改自己的管理员权限" : superAdminLocked ? "只有超级管理员可以修改超级管理员" : "没有 edit_admin_roles 或 manage_admins 权限"} />
              )}
            </section>

            <section className="rounded-xl border border-slate-100 p-3">
              <h3 className="text-sm font-black text-slate-950">{admin.isActive ? "停用管理员" : "恢复管理员"}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{admin.isActive ? "停用后该账号不能继续使用后台权限。" : "恢复后该账号可重新使用对应后台权限。"}</p>
              {selfLocked ? (
                <DisabledReason reason="不能停用或恢复自己的管理员账号" />
              ) : superAdminLocked ? (
                <DisabledReason reason="只有超级管理员可以停用或恢复超级管理员" />
              ) : admin.isActive && canDisable ? (
                <AdminActionForm
                  action={setAdminRoleActive}
                  submitLabel="确认停用"
                  className="mt-3 grid gap-2"
                  submitClassName="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                  footerClassName="flex flex-col gap-2 sm:flex-row sm:justify-end"
                  footerStart={<CancelButton onClick={closeDialog} />}
                  onSuccess={closeAfterSuccess}
                >
                  <input type="hidden" name="role_id" value={admin.id} />
                  <input type="hidden" name="active" value="false" />
                  <ConfirmInput />
                </AdminActionForm>
              ) : !admin.isActive && canRestore ? (
                <AdminActionForm
                  action={setAdminRoleActive}
                  submitLabel="确认恢复"
                  className="mt-3 grid gap-2"
                  footerClassName="flex flex-col gap-2 sm:flex-row sm:justify-end"
                  footerStart={<CancelButton onClick={closeDialog} />}
                  onSuccess={closeAfterSuccess}
                >
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
          </section>
        </div>
      ) : null}
    </>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
    >
      取消
    </button>
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

function RoleSelect({
  name,
  value,
  allowSuperAdmin,
  onChange,
}: {
  name: string;
  value: AdminRoleName;
  allowSuperAdmin: boolean;
  onChange: (role: AdminRoleName) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>角色名称</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value as AdminRoleName)}
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
      >
        {adminRoleOptions.map((option) => (
          <option key={option.value} value={option.value} disabled={option.value === "super_admin" && !allowSuperAdmin}>
            {formatRoleLabel(option.value)}
            {option.value === "super_admin" && !allowSuperAdmin ? "（仅超级管理员）" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConfirmInput() {
  return <AdminTextInput label="二次确认：请输入 CONFIRM 确认本次管理员权限调整" name="confirm" placeholder="CONFIRM" required />;
}

function DisabledReason({ reason }: { reason: string }) {
  return <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">不可操作：{reason}</p>;
}

function formatRoleLabel(role: AdminRoleName) {
  return getAdminRoleLabel(role);
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
