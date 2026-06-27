"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, Search, ShieldCheck, UserRound } from "lucide-react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { getAdminPermissionLabel } from "@/features/admins/adminRoleConfig";
import { setAdminUserStatus, updateAdminUserNote, type AdminUserActionState } from "@/features/users/adminActions";
import type { AdminUserListItem, AdminUsersPermissions } from "@/features/users/adminQueries";
import type { ProfileStatus } from "@/lib/supabase/types";

const initialState: AdminUserActionState = { ok: true, message: "" };

const statusLabels: Record<ProfileStatus, string> = {
  active: "启用",
  restricted: "受限",
  banned: "封禁",
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
      <Badge allowed={permissions.viewUserContacts} label="view_user_contacts" />
      <Badge allowed={permissions.manageUserStatus} label="manage_user_status" />
      <Badge allowed={permissions.editUserNotes} label="edit_user_notes" />
      <Badge allowed={permissions.restrictUsers} label="restrict_users" />
      <Badge allowed={permissions.banUsers} label="ban_users" />
      <Badge allowed={permissions.restoreUsers} label="restore_users" />
    </>
  );
}

export function AdminUsersStats({ totals }: { totals: { total: number; active: number; restricted: number; banned: number; pending: number } }) {
  const items = [
    { label: "用户总数", value: totals.total },
    { label: "启用", value: totals.active },
    { label: "受限", value: totals.restricted },
    { label: "封禁", value: totals.banned },
    { label: "待完善", value: totals.pending },
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

export function AdminUsersFilter({
  status,
  accountType,
  q,
  canSearchContacts,
}: {
  status?: string;
  accountType?: string;
  q?: string;
  canSearchContacts: boolean;
}) {
  return (
    <form className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr_auto]" action="/admin/users">
      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        <span>状态</span>
        <select name="status" defaultValue={status ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
          <option value="all">全部</option>
          <option value="active">启用</option>
          <option value="restricted">受限</option>
          <option value="banned">封禁</option>
          <option value="pending">待完善</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        <span>账号类型</span>
        <select name="accountType" defaultValue={accountType ?? "all"} className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
          <option value="all">全部</option>
          <option value="personal">个人账号</option>
          <option value="business">商家账号</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        <span>搜索</span>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={canSearchContacts ? "邮箱、昵称、手机号、微信、WhatsApp 或用户 ID" : "邮箱、昵称或用户 ID"}
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

export function AdminUsersList({
  users,
  permissions,
  currentAdminId,
}: {
  users: AdminUserListItem[];
  permissions: AdminUsersPermissions;
  currentAdminId: string | null;
}) {
  if (users.length === 0) {
    return <AdminEmptyState title="暂无用户。" />;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <AdminUserCard key={user.id} user={user} permissions={permissions} currentAdminId={currentAdminId} />
      ))}
    </div>
  );
}

function AdminUserCard({ user, permissions, currentAdminId }: { user: AdminUserListItem; permissions: AdminUsersPermissions; currentAdminId: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const isCurrentAdmin = user.id === currentAdminId;

  return (
    <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[user.status]}`}>{statusLabels[user.status]}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{user.accountType === "business" ? "商家账号" : "个人账号"}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {user.emailVerified ? "邮箱已验证" : "邮箱未验证"}
            </span>
            {user.isVerifiedUser ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">平台认证</span> : null}
            {isCurrentAdmin ? <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">当前管理员</span> : null}
          </div>
          <h2 className="mt-3 truncate text-base font-black text-slate-950">{user.nickname || user.email || "未命名用户"}</h2>
          <p className="mt-1 break-all text-sm text-slate-600">{user.email || "未绑定邮箱"}</p>
          <p className="mt-1 break-all text-xs font-mono text-slate-400">{user.id}</p>
        </div>
        <UserRound className="mt-1 shrink-0 text-slate-300" size={24} aria-hidden="true" />
      </div>

      <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200" aria-expanded={expanded}>
        {expanded ? "收起" : "展开"}
        {expanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
      </button>

      {expanded ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <InfoRow label="所在区域" value={user.locationArea || "未填写"} />
            <InfoRow label="信任等级" value={`Lv.${user.trustLevel}`} />
            <InfoRow label="最近登录" value={formatDateTime(user.lastLoginAt)} />
            <InfoRow label="最近活跃" value={formatDateTime(user.lastActiveAt)} />
            <InfoRow label="更新时间" value={formatDate(user.updatedAt)} />
            <InfoRow label="创建时间" value={formatDate(user.createdAt)} />
            <InfoRow label="用户帖子" value={formatPostCounts(user.postCounts, permissions)} />
          </dl>

          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">联系方式</p>
            {permissions.viewUserContacts ? (
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <InfoRow label="手机" value={user.phone || "未填写"} />
                <InfoRow label="微信" value={user.wechatId || "未填写"} />
                <InfoRow label="WhatsApp" value={user.whatsapp || "未填写"} />
                <InfoRow label="偏好方式" value={formatContactMethod(user.preferredContactMethod)} />
              </dl>
            ) : (
              <p className="mt-2 text-sm font-bold text-slate-500">当前管理员没有{getAdminPermissionLabel("view_user_contacts")}权限，联系方式已隐藏。</p>
            )}
          </div>

          {(user.adminNote || user.bannedReason || canEditUserNotes(permissions)) ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Admin Note</p>
              {user.adminNote ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{user.adminNote}</p> : null}
              {user.bannedReason ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-700">封禁原因：{user.bannedReason}</p> : null}
              {canEditUserNotes(permissions) ? <UserNoteForm user={user} /> : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {canChangeStatus(permissions) ? (
              <UserStatusForm user={user} permissions={permissions} isCurrentAdmin={isCurrentAdmin} />
            ) : (
              <span className="text-xs font-bold text-slate-500">当前账号只能查看，不能修改用户状态。</span>
            )}
            <Link href={`/admin/user-posts?author=${encodeURIComponent(user.id)}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
              去用户发布信息管理
            </Link>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function UserNoteForm({ user }: { user: AdminUserListItem }) {
  const [state, formAction, pending] = useActionState(updateAdminUserNote, initialState);

  return (
    <form action={formAction} className="mt-3 grid gap-2">
      <input type="hidden" name="id" value={user.id} />
      <label className="grid gap-1 text-xs font-bold text-slate-600">
        <span>管理员备注</span>
        <textarea
          name="admin_note"
          rows={2}
          defaultValue={user.adminNote ?? ""}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
        />
      </label>
      <label className="grid gap-1 text-xs font-bold text-slate-600">
        <span>封禁原因</span>
        <input
          name="banned_reason"
          defaultValue={user.bannedReason ?? ""}
          className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "保存中..." : "保存备注"}
        </button>
        {state.message ? <span className={state.ok ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-600"}>{state.message}</span> : null}
      </div>
    </form>
  );
}

export function AdminUsersPagination({
  page,
  pageCount,
  totalCount,
  status,
  accountType,
  q,
}: {
  page: number;
  pageCount: number;
  totalCount: number;
  status?: string;
  accountType?: string;
  q?: string;
}) {
  const base = new URLSearchParams();
  if (status) base.set("status", status);
  if (accountType) base.set("accountType", accountType);
  if (q) base.set("q", q);

  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams(base);
    params.set("page", String(nextPage));
    return `/admin/users?${params.toString()}`;
  };

  return (
    <AdminPagination
      page={page}
      pageCount={pageCount}
      totalCount={totalCount}
      summary={<>共 {totalCount} 位用户，第 {page} / {pageCount} 页</>}
      previousHref={hrefFor(Math.max(1, page - 1))}
      nextHref={hrefFor(Math.min(pageCount, page + 1))}
      showDisabled
      className="rounded-none bg-transparent px-0 py-0 font-bold text-slate-500"
      buttonClassName="bg-slate-100 text-sm text-slate-700"
      ariaLabel="用户分页"
    />
  );
}

function UserStatusForm({ user, permissions, isCurrentAdmin }: { user: AdminUserListItem; permissions: AdminUsersPermissions; isCurrentAdmin: boolean }) {
  const [state, formAction, pending] = useActionState(setAdminUserStatus, initialState);
  const options = allowedStatusOptions(user.status, permissions);

  if (options.length === 0) return null;

  if (isCurrentAdmin) {
    return <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-700">不能在这里修改自己的账号状态</span>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2" onSubmit={(event) => confirmStatusChange(event, user)}>
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

function confirmStatusChange(event: FormEvent<HTMLFormElement>, user: AdminUserListItem) {
  const formData = new FormData(event.currentTarget);
  const nextStatus = formData.get("status");
  if (typeof nextStatus !== "string" || !isProfileStatus(nextStatus) || nextStatus === user.status) return;

  const message =
    nextStatus === "banned"
      ? `确定封禁用户“${user.nickname || user.email || user.id}”吗？封禁后该用户不能继续正常使用发布和编辑能力。`
      : nextStatus === "restricted"
        ? `确定限制用户“${user.nickname || user.email || user.id}”吗？受限后该用户不能发布新内容或恢复公开。`
        : nextStatus === "active"
          ? `确定恢复用户“${user.nickname || user.email || user.id}”为启用状态吗？`
          : `确定将用户“${user.nickname || user.email || user.id}”标记为待完善吗？`;

  if (!window.confirm(message)) {
    event.preventDefault();
  }
}

function isProfileStatus(value: string): value is ProfileStatus {
  return value === "active" || value === "restricted" || value === "banned" || value === "pending";
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

function canEditUserNotes(permissions: AdminUsersPermissions) {
  return permissions.manageUserStatus && permissions.editUserNotes;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <dt className="shrink-0 font-bold text-slate-700">{label}</dt>
      <dd className="min-w-0 truncate text-right text-slate-600">{value}</dd>
    </div>
  );
}

function formatPostCounts(postCounts: AdminUserListItem["postCounts"], permissions: AdminUsersPermissions) {
  if (!permissions.viewUserPosts) return `无${getAdminPermissionLabel("view_user_posts")}权限`;
  if (!postCounts) return `需要${getAdminPermissionLabel("view_posts")}或${getAdminPermissionLabel("moderate_posts")}权限`;
  return `总 ${postCounts.total} · 招聘 ${postCounts.job} · 房屋 ${postCounts.housing} · 二手 ${postCounts.marketplace} · 服务 ${postCounts.service}`;
}

function formatContactMethod(value: string | null) {
  if (value === "phone") return "电话";
  if (value === "wechat") return "微信";
  if (value === "whatsapp") return "WhatsApp";
  if (value === "email") return "邮箱";
  return value || "未填写";
}

function Badge({ allowed, label }: { allowed: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${allowed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      <ShieldCheck size={13} aria-hidden="true" />
      {getAdminPermissionLabel(label)}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function formatDateTime(value: string | null) {
  if (!value) return "暂无记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
