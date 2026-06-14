import Link from "next/link";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminBackNavigation } from "@/components/admin/AdminBackNavigation";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { NavigationRecycleBinList } from "@/components/navigation/NavigationRecycleBinManagement";
import { getAdminNavigationRecycleBinData, type NavigationRecycleBinKind } from "@/features/navigation/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "导航删除管理",
  description: "OpenAA 后台公共导航删除管理。",
  path: "/admin/navigation/recycle-bin",
  noIndex: true,
});

type NavigationRecycleBinPageProps = {
  searchParams?: Promise<{ kind?: string }>;
};

const tabs: Array<{ value: NavigationRecycleBinKind; label: string }> = [
  { value: "links", label: "网站" },
  { value: "categories", label: "分类" },
];

export default function AdminNavigationRecycleBinPage({ searchParams }: NavigationRecycleBinPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const kind = normalizeKind(params?.kind);
        const data = await getAdminNavigationRecycleBinData(kind);

        if (!data.permissions.manageNavigation) {
          return (
            <div className="space-y-4">
              <AdminBackNavigation />
              <AdminPageHeader title="导航删除管理" description="当前管理员没有 manage_navigation 权限。" />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <AdminBackNavigation />
              <Link href="/admin/navigation" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                返回导航管理
              </Link>
              <AdminLogoutButton />
            </div>

            <AdminPageHeader title="导航删除管理" description="只管理已软删除的公共导航数据；不做图片、健康检查或自动清理。" />

            <nav aria-label="导航删除管理分类" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex gap-2">
                {tabs.map((tab) => (
                  <Link
                    key={tab.value}
                    href={tab.value === "links" ? "/admin/navigation/recycle-bin" : `/admin/navigation/recycle-bin?kind=${tab.value}`}
                    className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black ring-1 ${
                      data.kind === tab.value ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </nav>

            {data.state === "error" ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{data.error ?? "导航删除管理读取失败，请稍后再试。"}</div> : null}

            <AdminCard title="已删除导航" description="恢复会清空 deleted_at / deleted_by；永久删除会直接物理删除记录。">
              <NavigationRecycleBinList links={data.links} kind={data.kind} />
            </AdminCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeKind(value?: string): NavigationRecycleBinKind {
  return value === "categories" ? "categories" : "links";
}
