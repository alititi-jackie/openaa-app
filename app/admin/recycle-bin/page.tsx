import Link from "next/link";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminBackNavigation } from "@/components/admin/AdminBackNavigation";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { OrphanFavoritesNotice, RecycleBinHealthSection, RecycleBinList, RecycleBinSettingsSection } from "@/components/posts/AdminRecycleBinManagement";
import { getRecycleBinData, type RecycleBinFilter } from "@/features/posts/adminQueries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "删除管理",
  description: "OpenAA 后台删除管理与回收站。",
  path: "/admin/recycle-bin",
  noIndex: true,
});

const tabs: Array<{ value: RecycleBinFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "job", label: "招聘" },
  { value: "housing", label: "房屋" },
  { value: "marketplace", label: "二手" },
  { value: "service", label: "服务" },
  { value: "expired", label: "已超期" },
  { value: "with_images", label: "带图片" },
  { value: "image_error", label: "图片异常" },
];

type RecycleBinPageProps = {
  searchParams?: Promise<{ filter?: string }>;
};

export default function AdminRecycleBinPage({ searchParams }: RecycleBinPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const filter = normalizeFilter(params?.filter);
        const data = await getRecycleBinData(filter);

        if (!data.superAdmin) {
          return (
            <div className="space-y-4">
              <AdminBackNavigation />
              <AdminPageHeader title="删除管理" description="只有超级管理员可以访问删除管理">
                <AdminPermissionBadge allowed={false} label="super_admin" />
              </AdminPageHeader>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <AdminBackNavigation />
              <AdminLogoutButton />
            </div>

            <AdminPageHeader title="删除管理" description="第一版只管理招聘、房屋、二手和服务四类用户发布内容。">
              <AdminPermissionBadge allowed={data.superAdmin} label="super_admin" />
            </AdminPageHeader>

            <nav aria-label="删除管理分类" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex gap-2">
                {tabs.map((tab) => (
                  <Link
                    key={tab.value}
                    href={tab.value === "all" ? "/admin/recycle-bin" : `/admin/recycle-bin?filter=${tab.value}`}
                    className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black ring-1 ${
                      data.filter === tab.value ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </nav>

            {data.error ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{data.error}</div> : null}

            <RecycleBinSettingsSection settings={data.retentionSettings} />
            <RecycleBinHealthSection health={data.health} activeFilter={data.filter} />
            <OrphanFavoritesNotice visible={data.filter === "orphan_favorites"} count={data.health.orphanFavoriteCount} />

            <AdminCard title="回收站列表" description="恢复会先变为隐藏状态；永久删除后不可恢复。">
              <RecycleBinList items={data.items} />
            </AdminCard>
          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizeFilter(value?: string): RecycleBinFilter {
  return value === "job" ||
    value === "housing" ||
    value === "marketplace" ||
    value === "service" ||
    value === "expired" ||
    value === "with_images" ||
    value === "image_error" ||
    value === "orphan_favorites"
    ? value
    : "all";
}
