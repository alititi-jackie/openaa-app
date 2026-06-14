import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminNavigationLinkClassName } from "./AdminBackNavigation";
import { AdminLogoutButton } from "./AdminLogoutButton";

const ADMIN_HOME_PATH = "/admin/dashboard";

export function AdminFooterNavigation() {
  return (
    <nav aria-label="后台底部导航" className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <Link href={ADMIN_HOME_PATH} className={adminNavigationLinkClassName}>
          <ArrowLeft size={16} aria-hidden="true" />
          返回总后台
        </Link>
        <AdminLogoutButton />
      </div>
    </nav>
  );
}
