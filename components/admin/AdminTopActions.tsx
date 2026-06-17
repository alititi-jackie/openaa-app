"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminNavigationButtonClassName, AdminLogoutButton } from "./AdminLogoutButton";

const ADMIN_HOME_PATH = "/admin/dashboard";

export function AdminTopActions() {
  const pathname = usePathname();
  const isAdminHome = pathname === "/admin" || pathname === ADMIN_HOME_PATH;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAdminHome ? (
        <Link href="/profile" className={adminNavigationButtonClassName}>
          <ArrowLeft size={16} aria-hidden="true" />
          返回我的
        </Link>
      ) : (
        <Link href={ADMIN_HOME_PATH} className={adminNavigationButtonClassName}>
          <ArrowLeft size={16} aria-hidden="true" />
          返回总后台
        </Link>
      )}
      <AdminLogoutButton />
    </div>
  );
}
