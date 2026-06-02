"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Search, ShieldCheck, UserRound } from "lucide-react";
import { setAdminUserStatus, type AdminUserActionState } from "@/features/users/adminActions";
import type { AdminUserListItem, AdminUsersPermissions } from "@/features/users/adminQueries";
import type { ProfileStatus } from "@/lib/supabase/types";

const initialState: AdminUserActionState = { ok: true, message: "" };

const statusLabels: Record<ProfileStatus, string> = {
  active: "正常",
  restricted: "受限",
  banned: "禁用",
  pending: "待完善",
};

const statusStyles: Record<ProfileStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  restricted: "bg-amber-50 text-amber-700",
  banned: "bg-red-50 text-red-700",
  pending: "bg-slate-100 text-slate-600",
};

export function AdminUsersPermissionBadges({ permissions }: { permissions: AdminUsersPermissions }) {
  return (
    <>
      <Badge allowed={permissions.viewUsers} label="view_users" />
      <Badge allowed={permissions.manageUserStatus} label="manage_user_status" />
      <Badge allowed={permissions.restrictUsers} label="restrict_users" />
      <Badge allowed={permissions.banUsers} label="ban_users" />
      <Badge allowed={permissions.restoreUsers} label="restore_users" />
    </>
  );
}

export function AdminUsersFilter({ status, q }: { status?: string; q?: string }) {
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" action="/admin/users">
      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        <span>状态</span>
        <select name="status" defaultValue={status ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
          <option value="all">全部</option>
          <option value="active">正常</option>
          <option value="restricted">受限</option>
          <option value="banned">禁用</option>
          <option value="pending">待完善</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        <span>搜索</span>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="邮箱、昵称或用户 ID"
          className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
        />
      </label>
      <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white sm:self-end">
        <Search size={16} aria-hidden="true" />
        筛选
      </button>
    </form>
  );
}

export function AdminUsersList({ users, permissions }: { users: AdminUserListItem[]; permissions: AdminUsersPermissions }) {
  if (users.length === 0) {
    return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">暂无用户。</div>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <article key={user.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[user.status]}`}>{statusLabels[user.status]}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{user.accountType === "business" ? "商家账号" : "个人账号"}</span>
              </div>
              <h2 className="mt-3 text-base font-black text-slate-950">{user.nickname || user.email || "未命名用户"}</h2>
              <p className="mt-1 break-all text-sm text-slate-600">{user.email || "未绑定邮箱"}</p>
              <p className="mt-1 break-all text-xs font-mono text-slate-400">{user.id}</p>
            </div>
            <UserRound className="text-slate-300" size={22} aria-hidden="true" />
          </div>

          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <InfoRow label="所在区域" value={user.locationArea || "未填写"} />
            <InfoRow label="更新时间" value={formatDate(user.updatedAt)} />
            <InfoRow label="创建时间" value={formatDate(user.createdAt)} />
            <InfoRow label="用户帖子" value={permissions.viewUserPosts ? "可通过帖子管理按用户核查" : "无 view_user_posts 权限"} />
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {canChangeStatus(permissions) ? <UserStatusForm user={user} permissions={permissions} /> : <span className="text-xs font-bold text-slate-500">当前账号只能查看，不能修改用户状态。</span>}
            <Link href={`/admin/posts?author=${encodeURIComponent(user.id)}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
              去帖子管理
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminUsersPagination({
  page,
  pageCount,
  totalCount,
  status,
  q,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  status?: string;
  q?: string;
}) {
  const base = new URLSearchParams();
  if (status) base.set("status", status);
  if (q) base.set("q", q);

  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams(base);
    params.set("page", String(nextPage));
    return `/admin/users?${params.toString()}`;
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="font-bold text-slate-500">
        共 {totalCount} 位用户，第 {page} / {pageCount} 页
      </p>
      <div className="flex gap-2">
        <Link className="rounded-full bg-slate-100 px-3 py-1.5 font-black text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40" href={hrefFor(Math.max(1, page - 1))} aria-disabled={page <= 1}>
          上一页
        </Link>
        <Link className="rounded-full bg-slate-100 px-3 py-1.5 font-black text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40" href={hrefFor(Math.min(pageCount, page + 1))} aria-disabled={page >= pageCount}>
          下一页
        </Link>
      </div>
    </div>
  );
}

function UserStatusForm({ user, permissions }: { user: AdminUserListItem; permissions: AdminUsersPermissions }) {
  const [state, formAction, pending] = useActionState(setAdminUserStatus, initialState);
  const options = allowedStatusOptions(user.status, permissions);

  if (options.length === 0) return null;

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={user.id} />
      <select name="status" defaultValue={user.status} className="min-h-9 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-700">
        <option value={user.status}>{statusLabels[user.status]}</option>
        {options.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "保存中" : "更新状态"}
      </button>
      {state.message ? <span className={state.ok ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-600"}>{state.message}</span> : null}
    </form>
  );
}

function allowedStatusOptions(current: ProfileStatus, permissions: AdminUsersPermissions): ProfileStatus[] {
  const canManage = permissions.manageUserStatus;
  const options: ProfileStatus[] = [];
  if (current !== "restricted" && (canManage || permissions.restrictUsers)) options.push("restricted");
  if (current !== "banned" && (canManage || permissions.banUsers)) options.push("banned");
  if (current !== "active" && (canManage || permissions.restoreUsers)) options.push("active");
  if (current !== "pending" && canManage) options.push("pending");
  return options;
}

function canChangeStatus(permissions: AdminUsersPermissions) {
  return permissions.manageUserStatus || permissions.restrictUsers || permissions.banUsers || permissions.restoreUsers;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <dt className="shrink-0 font-bold text-slate-700">{label}</dt>
      <dd className="min-w-0 truncate text-right text-slate-600">{value}</dd>
    </div>
  );
}

function Badge({ allowed, label }: { allowed: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${allowed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      <ShieldCheck size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
