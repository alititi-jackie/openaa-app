import type { ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { requireAdmin, type AdminCheckResult } from "@/lib/permissions/admin";
import { AdminPageHeader } from "./AdminPageHeader";

type AdminAuthGateProps = {
  children: (admin: Extract<AdminCheckResult, { status: "authorized" }>) => ReactNode;
};

export async function AdminAuthGate({ children }: AdminAuthGateProps) {
  const admin = await requireAdmin();

  if (admin.status === "missing_config") {
    return (
      <AdminPageHeader
        title="后台"
        description="Supabase 环境变量尚未配置。配置新 Supabase 后，后台会在服务端检查 admin_roles。"
      />
    );
  }

  if (admin.status === "unauthenticated") {
    return (
      <AdminAccessMessage
        icon={<LockKeyhole size={22} aria-hidden="true" />}
        title="需要登录"
        description="请先登录 OpenAA 账号，然后再访问后台。"
        actionHref="/login?returnTo=/admin"
        actionLabel="去登录"
      />
    );
  }

  if (admin.status === "forbidden") {
    return (
      <AdminAccessMessage
        icon={<ShieldAlert size={22} aria-hidden="true" />}
        title="无后台权限"
        description="当前账号没有 active admin_roles 记录。后台权限只从 admin_roles 和权限表读取。"
      />
    );
  }

  return children(admin);
}

function AdminAccessMessage({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-700">{icon}</div>
      <h1 className="mt-4 text-2xl font-black text-slate-950">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
