"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const ADMIN_HOME_PATH = "/admin/dashboard";

export const adminNavigationLinkClassName =
  "inline-flex min-h-10 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50";

export function AdminBackNavigation() {
  const pathname = usePathname();
  const isAdminHome = pathname === "/admin" || pathname === ADMIN_HOME_PATH;
  const href = isAdminHome ? "/" : ADMIN_HOME_PATH;
  const label = isAdminHome ? "返回首页" : "返回总后台";

  return (
    <Link href={href} className={adminNavigationLinkClassName}>
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}
