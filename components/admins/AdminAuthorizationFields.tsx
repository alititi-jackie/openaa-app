"use client";

import { useMemo, useState } from "react";
import {
  adminExemptionOptions,
  adminRoleDescriptions,
  adminRoleOptions,
  getAdminPermissionLabel,
  getAdminRoleLabel,
  type AdminExemptionKey,
} from "@/features/admins/adminRoleConfig";
import type { AdminAuthorizationConfig } from "@/features/admins/adminQueries";
import type { AdminRoleName } from "@/lib/supabase/types";

type SelectableRole = AdminRoleName | "";
type SelectableStatus = "active" | "inactive" | "";

export function AdminAuthorizationFields({
  config,
  allowSuperAdmin,
  initialRole = "",
  initialStatus = "",
  initialPermissionKeys = [],
  initialExemptionKeys = [],
  ownerLocked = false,
}: {
  config: AdminAuthorizationConfig;
  allowSuperAdmin: boolean;
  initialRole?: SelectableRole;
  initialStatus?: SelectableStatus;
  initialPermissionKeys?: string[];
  initialExemptionKeys?: AdminExemptionKey[];
  ownerLocked?: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<SelectableRole>(initialRole);
  const [selectedStatus, setSelectedStatus] = useState<SelectableStatus>(initialStatus);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialPermissionKeys);
  const [selectedExemptions, setSelectedExemptions] = useState<AdminExemptionKey[]>(initialExemptionKeys);
  const isSuperAdmin = selectedRole === "super_admin";
  const visiblePermissions = useMemo(() => new Set(selectedPermissions), [selectedPermissions]);
  const visibleExemptions = useMemo(() => new Set(selectedExemptions), [selectedExemptions]);

  function onRoleChange(role: SelectableRole) {
    setSelectedRole(role);
    if (!role) {
      setSelectedPermissions([]);
      setSelectedExemptions([]);
      return;
    }
    if (role === "super_admin") {
      setSelectedPermissions(config.allPermissionKeys);
      setSelectedExemptions(adminExemptionOptions.map((option) => option.key));
      return;
    }
    setSelectedPermissions(config.rolePermissionDefaults[role] ?? []);
    setSelectedExemptions([]);
  }

  function togglePermission(permissionKey: string) {
    if (isSuperAdmin || ownerLocked) return;
    setSelectedPermissions((current) => current.includes(permissionKey) ? current.filter((key) => key !== permissionKey) : [...current, permissionKey].sort());
  }

  function toggleExemption(exemptionKey: AdminExemptionKey) {
    if (isSuperAdmin || ownerLocked) return;
    setSelectedExemptions((current) => current.includes(exemptionKey) ? current.filter((key) => key !== exemptionKey) : [...current, exemptionKey].sort());
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-2 rounded-xl bg-slate-50 p-3">
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>选择角色</span>
          <select
            name="role"
            value={selectedRole}
            required
            disabled={ownerLocked}
            onChange={(event) => onRoleChange(event.target.value as SelectableRole)}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">请选择角色</option>
            {adminRoleOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.value === "super_admin" && !allowSuperAdmin}>
                {getAdminRoleLabel(option.value)}
                {option.value === "super_admin" && !allowSuperAdmin ? "（仅超级管理员）" : ""}
              </option>
            ))}
          </select>
        </label>
        {selectedRole ? (
          <p className="rounded-lg bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600">{adminRoleDescriptions[selectedRole]}</p>
        ) : (
          <p className="rounded-lg bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-500">选择角色后会自动带出该角色的默认权限。</p>
        )}
      </section>

      <section className="rounded-xl bg-slate-50 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-slate-950">选择权限</h4>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              权限会按后台模块分组。普通角色可以手动增减；超级管理员默认全权限且不可减少。
            </p>
          </div>
          {selectedRole ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
              已选 {isSuperAdmin ? config.allPermissionKeys.length : selectedPermissions.length} 项
            </span>
          ) : null}
        </div>

        {!selectedRole ? (
          <p className="mt-3 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-500">请先选择角色。</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {isSuperAdmin ? config.allPermissionKeys.map((permissionKey) => <input key={permissionKey} type="hidden" name="permission_keys" value={permissionKey} />) : null}
            {config.permissionGroups.map((group) => (
              <section key={group.moduleKey} className="rounded-xl border border-slate-100 bg-white p-3">
                <div className="min-w-0">
                  <h5 className="text-sm font-black text-slate-900">{group.title}</h5>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{group.description}</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {group.permissions.map((permission) => {
                    const checked = isSuperAdmin || visiblePermissions.has(permission.permissionKey);
                    const disabled = isSuperAdmin || ownerLocked;
                    return (
                      <label
                        key={permission.permissionKey}
                        className={`grid min-h-[64px] gap-1 rounded-xl border px-3 py-2 text-sm ${checked ? "border-blue-100 bg-blue-50/40" : "border-slate-100 bg-white"}`}
                      >
                        <span className="flex items-start gap-2 font-bold text-slate-800">
                          <input
                            name={disabled ? undefined : "permission_keys"}
                            type="checkbox"
                            value={permission.permissionKey}
                            checked={checked}
                            disabled={disabled}
                            onChange={() => togglePermission(permission.permissionKey)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
                          />
                          <span className="min-w-0">{getAdminPermissionLabel(permission.permissionKey)}</span>
                        </span>
                        <span className="break-all pl-6 font-mono text-[11px] font-semibold leading-4 text-slate-400">{permission.permissionKey}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-2 rounded-xl bg-slate-50 p-3">
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>选择状态</span>
          <select
            name="status"
            value={selectedStatus}
            required
            disabled={ownerLocked}
            onChange={(event) => setSelectedStatus(event.target.value as SelectableStatus)}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">请选择状态</option>
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </label>
      </section>

      {selectedRole ? (
        <section className="rounded-xl bg-slate-50 p-3">
          <h4 className="text-sm font-black text-slate-950">限制豁免</h4>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">用于保留旧授权里的特殊能力。普通管理员默认不豁免，可手动勾选。</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {isSuperAdmin ? adminExemptionOptions.map((option) => <input key={option.key} type="hidden" name="exemption_keys" value={option.key} />) : null}
            {adminExemptionOptions.map((option) => {
              const checked = isSuperAdmin || visibleExemptions.has(option.key);
              const disabled = isSuperAdmin || ownerLocked;
              return (
                <label key={option.key} className={`grid gap-1 rounded-xl border px-3 py-2 text-sm ${checked ? "border-blue-100 bg-white" : "border-slate-100 bg-white/70"}`}>
                  <span className="flex items-start gap-2 font-bold text-slate-800">
                    <input
                      name={disabled ? undefined : "exemption_keys"}
                      type="checkbox"
                      value={option.key}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleExemption(option.key)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
                    />
                    <span>{option.label}</span>
                  </span>
                  <span className="pl-6 text-xs font-semibold leading-5 text-slate-500">{option.description}</span>
                </label>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
