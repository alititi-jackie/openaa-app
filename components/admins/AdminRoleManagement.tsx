"use client";

import Link from "next/link";
import { AdminActionForm, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminAdminManageDialog } from "@/components/admins/AdminAdminPermissionDialog";
import { AdminAuthorizationFields } from "@/components/admins/AdminAuthorizationFields";
import { ADMIN_MODULES } from "@/features/admin/adminModules";
import { grantAdminRole } from "@/features/admins/adminActions";
import { adminExemptionOptions, adminRoleOptions, getAdminRoleLabel, getAdminStatusLabel } from "@/features/admins/adminRoleConfig";
import type { AdminAuthorizationConfig, AdminCandidate, AdminRoleListItem, AdminsPermissions } from "@/features/admins/adminQueries";
import type { AdminRoleName } from "@/lib/supabase/types";

const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/New_York",
};

export function AdminRoleStats({ admins }: { admins: AdminRoleListItem[] }) {
  const active = admins.filter((admin) => admin.isActive).length;
  const inactive = admins.length - active;
  const items = [
    { label: "其他管理员", value: admins.length },
    { label: "启用", value: active },
    { label: "停用", value: inactive },
  ];

  return (
    <div className="max-w-full overflow-x-auto overflow-y-hidden rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex min-w-max items-center gap-3 text-sm">
        {items.map((item, index) => (
          <span key={item.label} className="inline-flex items-center gap-1.5 whitespace-nowrap font-bold text-slate-600">
            {index > 0 ? <span className="text-slate-300">|</span> : null}
            <span>{item.label}</span>
            <span className="font-black text-slate-950">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminRoleSearch({ q, role, status }: { q?: string; role?: string; status?: string }) {
  return (
    <form action="/admin/admins" className="grid gap-3 md:grid-cols-4">
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="先搜索真实用户邮箱、昵称或 user id"
        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-4"
      />
      <select name="role" defaultValue={role ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        <option value="all">全部角色</option>
        {adminRoleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {formatRoleLabel(option.value)}
          </option>
        ))}
      </select>
      <select name="status" defaultValue={status ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 md:col-span-2">
        <option value="all">全部状态</option>
        <option value="active">启用</option>
        <option value="inactive">停用</option>
      </select>
      <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
        搜索用户/管理员
      </button>
    </form>
  );
}

export function AdminCandidates({ candidates, permissions, authorizationConfig }: { candidates: AdminCandidate[]; permissions: AdminsPermissions; authorizationConfig: AdminAuthorizationConfig }) {
  if (candidates.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">输入邮箱、昵称或 user id 后，会在这里显示真实用户候选项。必须确认 user id 后才能授权。</p>;
  }

  return (
    <div className="space-y-3">
      {candidates.map((candidate) => (
        <article key={candidate.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-black text-slate-950">{candidate.nickname || candidate.email || "未命名用户"}</h3>
              <p className="mt-1 break-all text-sm text-slate-600">{candidate.email || "未绑定邮箱"}</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-400">{candidate.id}</p>
              {candidate.existingAdminRole ? (
                <p className="mt-2 text-xs font-bold text-amber-700">
                  已有后台角色：{formatRoleLabel(candidate.existingAdminRole)} · {getAdminStatusLabel(candidate.existingAdminActive)}
                </p>
              ) : null}
            </div>
            <GrantAdminForm candidate={candidate} permissions={permissions} authorizationConfig={authorizationConfig} />
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminRolesList({ admins, permissions, authorizationConfig }: { admins: AdminRoleListItem[]; permissions: AdminsPermissions; authorizationConfig: AdminAuthorizationConfig }) {
  if (admins.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无其他管理员记录。</p>;
  }

  return (
    <div className="space-y-3">
      {admins.map((admin) => (
        <article key={admin.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-black text-slate-950">{getAdminDisplayName(admin.nickname, admin.email)}</h3>
              <p className="mt-1 break-all text-sm text-slate-600">{admin.email || "未绑定邮箱"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">角色：{formatRoleLabel(admin.role)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${admin.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>状态：{getAdminStatusLabel(admin.isActive)}</span>
              </div>
              <p className="mt-1 break-all font-mono text-xs text-slate-400">{admin.userId}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">授权：{formatDateTime(admin.grantedAt)} · 最近后台登录：{formatDateTime(admin.lastAdminLoginAt)}</p>
              <AdminGrantSummary admin={admin} />
            </div>
            {!admin.isCurrentUser ? <AdminAdminManageDialog admin={admin} permissions={permissions} authorizationConfig={authorizationConfig} /> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminGrantSummary({ admin }: { admin: AdminRoleListItem }) {
  const moduleLabels = admin.role === "super_admin"
    ? ["全部后台功能"]
    : ADMIN_MODULES.filter((module) => admin.moduleKeys.includes(module.key)).map((module) => module.title);
  const exemptionLabels = adminExemptionOptions
    .filter((option) => admin.exemptionKeys.includes(option.key))
    .map((option) => option.label);

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <SummaryRow label="功能授权" emptyLabel="暂无功能授权" items={moduleLabels} />
      <SummaryRow label="权限数量" items={[`${admin.permissionKeys.length} 项权限`]} />
      {exemptionLabels.length > 0 ? <SummaryRow label="限制豁免" items={exemptionLabels} /> : null}
    </div>
  );
}

function SummaryRow({ label, items, emptyLabel }: { label: string; items: string[]; emptyLabel?: string }) {
  return (
    <div className="mt-2 grid gap-1.5">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((item) => (
            <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              {item}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-400 ring-1 ring-slate-200">
            {emptyLabel ?? "暂无"}
          </span>
        )}
      </div>
    </div>
  );
}

function getAdminDisplayName(nickname: string | null, email: string | null) {
  const name = nickname?.trim();
  if (name) return name;
  const emailPrefix = email?.split("@")[0]?.trim();
  return emailPrefix || "未命名管理员";
}

function GrantAdminForm({ candidate, permissions, authorizationConfig }: { candidate: AdminCandidate; permissions: AdminsPermissions; authorizationConfig: AdminAuthorizationConfig }) {
  const canGrant = permissions.addAdmins || permissions.manageAdmins || permissions.superAdmin;
  if (!canGrant) return <DisabledReason reason="当前账号不能新增管理员授权" />;
  return (
    <AdminActionForm
      action={grantAdminRole}
      submitLabel="确认授权"
      className="grid w-full gap-4 lg:w-[620px]"
      footerClassName="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
    >
      <input type="hidden" name="user_id" value={candidate.id} />
      <AdminAuthorizationFields config={authorizationConfig} allowSuperAdmin={permissions.superAdmin} />
      <AdminTextInput label="备注" name="note" placeholder="例如：客服排班 / 内容审核" />
      <ConfirmInput />
    </AdminActionForm>
  );
}

export function AdminRolePagination({ page, pageCount, totalCount, q, role, status }: { page: number; pageCount: number; totalCount: number; q?: string; role?: string; status?: string }) {
  const previous = buildPageHref({ page: Math.max(1, page - 1), q, role, status });
  const next = buildPageHref({ page: Math.min(pageCount, page + 1), q, role, status });
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
      <span>
        共 {totalCount} 位其他管理员 · 第 {page} / {pageCount} 页
      </span>
      <div className="flex gap-2">
        {page > 1 ? <Link href={previous} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">上一页</Link> : null}
        {page < pageCount ? <Link href={next} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700">下一页</Link> : null}
      </div>
    </div>
  );
}

export function RoleSelect({ name, defaultValue, allowSuperAdmin }: { name: string; defaultValue: AdminRoleName; allowSuperAdmin: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>角色</span>
      <select name={name} defaultValue={defaultValue} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
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

export function ConfirmInput() {
  return <AdminTextInput label="二次确认：请输入 CONFIRM" name="confirm" placeholder="CONFIRM" required />;
}

export function DisabledReason({ reason }: { reason: string }) {
  return <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">不可操作：{reason}</p>;
}

export function formatRoleLabel(role: AdminRoleName) {
  return getAdminRoleLabel(role);
}

export function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", DATE_TIME_FORMAT_OPTIONS);
}

function buildPageHref({ page, q, role, status }: { page: number; q?: string; role?: string; status?: string }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role && role !== "all") params.set("role", role);
  if (status && status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/admins?${query}` : "/admin/admins";
}
