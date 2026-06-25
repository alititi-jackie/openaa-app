"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminActionForm, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminAuthorizationFields } from "@/components/admins/AdminAuthorizationFields";
import { updateAdminRole } from "@/features/admins/adminActions";
import { getAdminRoleLabel, getAdminStatusLabel } from "@/features/admins/adminRoleConfig";
import type { AdminAuthorizationConfig, AdminRoleListItem, AdminsPermissions } from "@/features/admins/adminQueries";
import type { AdminRoleName } from "@/lib/supabase/types";

const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/New_York",
};

export function AdminAdminManageDialog({
  admin,
  permissions,
  authorizationConfig,
}: {
  admin: AdminRoleListItem;
  permissions: AdminsPermissions;
  authorizationConfig: AdminAuthorizationConfig;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const canUpdate = permissions.editAdminRoles || permissions.manageAdmins || permissions.superAdmin;
  const superAdminLocked = admin.role === "super_admin" && !permissions.superAdmin;
  const selfLocked = admin.isCurrentUser;
  const ownerLocked = admin.isOwnerSuperAdmin;

  const closeDialog = useCallback(() => setOpen(false), []);
  const closeAfterSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <>
      <AdminActionButton onClick={() => setOpen(true)} variant="primary" className="shrink-0">
        管理
      </AdminActionButton>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 px-3 py-4 backdrop-blur-sm sm:items-center sm:py-6" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="管理员权限管理"
            className="flex max-h-[92vh] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[88vh]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">管理员管理</p>
                <h2 className="mt-1 truncate text-lg font-black text-slate-950">{admin.nickname || admin.email || "未命名管理员"}</h2>
                <p className="mt-1 break-all font-mono text-xs text-slate-400">{admin.userId}</p>
              </div>
              <button type="button" onClick={closeDialog} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" aria-label="关闭">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-2">
                <Info label="当前状态" value={getAdminStatusLabel(admin.isActive)} />
                <Info label="当前角色" value={formatRoleLabel(admin.role)} />
                <Info label="授权时间" value={formatDateTime(admin.grantedAt)} />
                <Info label="最近后台登录" value={formatDateTime(admin.lastAdminLoginAt)} />
              </div>

              {ownerLocked ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800">
                  这是本站内置首席超级管理员，只能通过代码或 migration 更换，不能在后台停用、降级、删除或减少权限。
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                  <p className="text-sm font-black text-slate-950">授权调整</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    保存后会立即影响该账号可进入的后台页面和可执行操作。必须输入 CONFIRM 完成二次确认。
                  </p>
                </div>
              )}

              {canUpdate && !superAdminLocked && !selfLocked && !ownerLocked ? (
                <AdminActionForm
                  action={updateAdminRole}
                  submitLabel="确认保存授权"
                  className="mt-4 grid gap-4"
                  footerClassName="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-2 border-t border-slate-100 bg-white/95 p-4 backdrop-blur sm:-mx-5 sm:-mb-5 sm:flex-row sm:justify-end sm:p-5"
                  footerStart={<CancelButton onClick={closeDialog} />}
                  onSuccess={closeAfterSuccess}
                >
                  <input type="hidden" name="role_id" value={admin.id} />
                  <AdminAuthorizationFields
                    config={authorizationConfig}
                    allowSuperAdmin={permissions.superAdmin}
                    initialRole={admin.role}
                    initialStatus={admin.isActive ? "active" : "inactive"}
                    initialPermissionKeys={admin.permissionKeys}
                    initialExemptionKeys={admin.exemptionKeys}
                  />
                  <AdminTextInput label="备注" name="note" defaultValue={admin.note} />
                  <ConfirmInput />
                </AdminActionForm>
              ) : (
                <DisabledReason
                  reason={
                    ownerLocked
                      ? "内置首席超级管理员不能在后台修改"
                      : selfLocked
                        ? "不能修改自己的管理员权限"
                        : superAdminLocked
                          ? "只有超级管理员可以修改超级管理员"
                          : "当前账号不能修改管理员权限"
                  }
                />
              )}
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

function ConfirmInput() {
  return <AdminTextInput label="二次确认：请输入 CONFIRM 确认本次管理员权限调整" name="confirm" placeholder="CONFIRM" required />;
}

function DisabledReason({ reason }: { reason: string }) {
  return <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">不可操作：{reason}</p>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2">
      <span className="shrink-0 font-bold text-slate-700">{label}</span>
      <span className="min-w-0 truncate text-right text-slate-600">{value}</span>
    </div>
  );
}

function formatRoleLabel(role: AdminRoleName) {
  return getAdminRoleLabel(role);
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", DATE_TIME_FORMAT_OPTIONS);
}
