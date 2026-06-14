import type { ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { requireAdmin, type AdminCheckResult } from "@/lib/permissions/admin";
import { AdminBackNavigation } from "./AdminBackNavigation";
import { AdminFooterNavigation } from "./AdminFooterNavigation";
import { AdminPageHeader } from "./AdminPageHeader";

type AdminAuthGateProps = {
  children: (admin: Extract<AdminCheckResult, { status: "authorized" }>) => ReactNode;
};

export async function AdminAuthGate({ children }: AdminAuthGateProps) {
  const admin = await requireAdmin();

  if (admin.status === "missing_config") {
    return (
      <AdminPageFrame>
        <AdminPageHeader title="后台" description="Supabase 环境变量尚未配置。配置新 Supabase 后，后台会在服务端检查 admin_roles。" />
      </AdminPageFrame>
    );
  }

  if (admin.status === "unauthenticated") {
    return (
      <AdminAccessFrame>
        <AdminAccessMessage
          icon={<LockKeyhole size={22} aria-hidden="true" />}
          title="需要登录"
          description="请先登录 OpenAA 账号，然后再访问后台。"
          actionHref="/login?returnTo=/admin"
          actionLabel="去登录"
          secondaryHref="/"
          secondaryLabel="取消"
        />
      </AdminAccessFrame>
    );
  }

  if (admin.status === "forbidden") {
    return (
      <AdminAccessFrame>
        <AdminAccessMessage
          icon={<ShieldAlert size={22} aria-hidden="true" />}
          title="无后台权限"
          description="当前账号没有 active admin_roles 记录。后台权限只从 admin_roles 和权限表读取。"
          secondaryHref="/"
          secondaryLabel="取消"
        />
      </AdminAccessFrame>
    );
  }

  return children(admin);
}

function AdminPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <AdminBackNavigation />
      </div>
      {children}
      <AdminFooterNavigation />
    </div>
  );
}

function AdminAccessFrame({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-10">{children}</div>;
}

function AdminAccessMessage({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="w-full max-w-[320px] bg-white text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">{icon}</div>
      <h1 className="mt-4 text-2xl font-black text-slate-950">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 grid gap-3">
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
          >
            {actionLabel}
          </Link>
        ) : null}
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
