import { BackButton } from "@/components/common/BackButton";

const ADMIN_HOME_PATH = "/admin/dashboard";

export function AdminFooterNavigation() {
  return (
    <nav aria-label="后台底部导航" className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <BackButton href="/" label="返回首页" />
        <BackButton href={ADMIN_HOME_PATH} label="返回总后台" />
      </div>
    </nav>
  );
}
