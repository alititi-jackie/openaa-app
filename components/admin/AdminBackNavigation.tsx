"use client";

import { usePathname } from "next/navigation";
import { BackButton } from "@/components/common/BackButton";

const ADMIN_HOME_PATH = "/admin/dashboard";

export function AdminBackNavigation({ href, label }: { href?: string; label?: string }) {
  const pathname = usePathname();
  const isAdminHome = pathname === "/admin" || pathname === ADMIN_HOME_PATH;
  const targetHref = href ?? (isAdminHome ? "/" : ADMIN_HOME_PATH);
  const targetLabel = label ?? (isAdminHome ? "返回首页" : "返回总后台");

  return <BackButton href={targetHref} label={targetLabel} />;
}
