import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
import { PublicStatusNotice } from "@/components/common/PublicStatusNotice";
import { FavoriteRemoveButton } from "@/components/profile/FavoriteRemoveButton";
import { FAVORITE_CENTER_TABS } from "@/features/favorites/helpers";
import { getMyFavorites } from "@/features/favorites/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCurrentUser } from "@/lib/supabase/server";
import { redirectToAuthRequired } from "@/lib/auth/redirects";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的收藏",
  description: "OpenAA 我的收藏入口。",
  path: "/profile/favorites",
  noIndex: true,
});

type ProfileFavoritesPageProps = {
  searchParams?: Promise<{ type?: string; page?: string }>;
};

export default async function ProfileFavoritesPage({ searchParams }: ProfileFavoritesPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirectToAuthRequired("/profile/favorites");
  }

  const params = await searchParams;
  const activeType = FAVORITE_CENTER_TABS.some((tab) => tab.value === params?.type) ? params?.type ?? "all" : "all";
  const result = await getMyFavorites({ type: activeType, page: params?.page });
  const tabs = FAVORITE_CENTER_TABS.map((tab) => ({ ...tab, href: tab.value === "all" ? "/profile/favorites" : `/profile/favorites?type=${tab.value}` }));

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <Link href="/profile" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm">
          <ArrowLeft size={16} aria-hidden="true" />
          返回
        </Link>
      </div>

      <HorizontalPillTabs tabs={tabs} activeValue={activeType} ariaLabel="收藏分类" />

      {result.state === "error" ? <PublicStatusNotice tone="error" className="p-3 font-bold">收藏读取失败，请稍后再试。</PublicStatusNotice> : null}
      {result.state === "missing_config" ? <PublicStatusNotice className="p-3">Supabase 环境变量尚未配置，当前显示空列表。</PublicStatusNotice> : null}

      {result.data.length > 0 ? (
        <section className="space-y-3">
          {result.data.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-[15px] font-black text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-xs font-bold text-blue-700">{item.category}</p>
                  <p className="mt-1 text-xs text-slate-500">收藏于 {formatFavoriteDate(item.createdAt)}</p>
                </div>
                <FavoriteRemoveButton favoriteId={item.id} />
              </div>

              <div className="mt-3 flex items-center gap-2">
                {item.isDeleted ? (
                  <span className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-400">
                    查看
                  </span>
                ) : isExternalUrl(item.targetUrl) ? (
                  <a
                    href={item.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-700"
                  >
                    查看
                  </a>
                ) : (
                  <Link href={item.targetUrl} className="inline-flex min-h-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-700">
                    查看
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState icon={<Bookmark size={22} aria-hidden="true" />} title="还没有收藏" description="收藏的招聘、房屋、二手、服务和新闻会显示在这里。" />
      )}

      {result.pagination && result.pagination.pageCount > 1 ? (
        <nav className="flex items-center justify-between gap-3" aria-label="收藏分页">
          <PageLink disabled={!result.pagination.hasPrevious} href={pageHref(activeType, result.pagination.page - 1)}>
            上一页
          </PageLink>
          <span className="text-xs font-bold text-slate-500">
            {result.pagination.page} / {result.pagination.pageCount}
          </span>
          <PageLink disabled={!result.pagination.hasNext} href={pageHref(activeType, result.pagination.page + 1)}>
            下一页
          </PageLink>
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return <span className="inline-flex min-h-10 items-center rounded-xl bg-slate-50 px-4 text-sm font-black text-slate-300">{children}</span>;
  }

  return (
    <Link href={href} className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm">
      {children}
    </Link>
  );
}

function pageHref(type: string, page: number) {
  const params = new URLSearchParams();
  if (type !== "all") params.set("type", type);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/profile/favorites?${query}` : "/profile/favorites";
}

function isExternalUrl(value: string) {
  return value.startsWith("https://");
}

function formatFavoriteDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
