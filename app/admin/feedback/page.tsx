import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  AdminFeedbackFilter,
  AdminFeedbackList,
  AdminFeedbackPagination,
  AdminFeedbackPermissionBadges,
  AdminFeedbackStats,
} from "@/components/feedback/AdminFeedbackManagement";
import { getAdminFeedbackData, normalizeFeedbackStatus } from "@/features/feedback/adminQueries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "反馈管理",
  description: "OpenAA 后台反馈管理。",
  path: "/admin/feedback",
  noIndex: true,
});

type AdminFeedbackPageProps = {
  searchParams?: Promise<{ status?: string; category?: string; q?: string; page?: string }>;
};

export default function AdminFeedbackPage({ searchParams }: AdminFeedbackPageProps) {
  return (
    <AdminAuthGate>
      {async () => {
        const params = await searchParams;
        const data = await getAdminFeedbackData({
          status: normalizeFeedbackStatus(params?.status),
          category: params?.category,
          q: params?.q,
          page: normalizePage(params?.page),
        });

        if (!data.permissions.viewFeedback) {
          return (
            <AdminPageHeader title="反馈管理" description="当前管理员没有 view_feedback 或 handle_feedback 权限。">
              <AdminFeedbackPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>
          );
        }

        return (
          <div className="space-y-4">
            <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              ← 返回总后台
            </Link>

            <AdminPageHeader title="反馈管理" description="查看、筛选和处理用户提交的问题反馈、功能建议、内容举报和新闻线索。">
              <AdminFeedbackPermissionBadges permissions={data.permissions} />
            </AdminPageHeader>

            {data.state === "error" || data.state === "missing_config" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                反馈后台读取暂时不可用：{data.error ?? "请稍后再试。"}
              </div>
            ) : null}

            <AdminFeedbackStats totals={data.totals} />

            <AdminCard title="筛选反馈" description="按状态、类型、标题、内容或邮箱快速筛选反馈记录。">
              <AdminFeedbackFilter status={params?.status} category={params?.category} q={params?.q} />
            </AdminCard>

            <AdminCard title="反馈列表" description="反馈不会被物理删除；关闭反馈只改变处理状态，方便后续追溯。">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <MessageSquareText size={15} aria-hidden="true" />
                默认按最近提交排序，每页显示 {data.pageSize} 条。
              </div>
              <AdminFeedbackList feedback={data.feedback} permissions={data.permissions} />
              <AdminFeedbackPagination
                page={data.page}
                pageCount={data.pageCount}
                totalCount={data.totalCount}
                status={params?.status}
                category={params?.category}
                q={params?.q}
              />
            </AdminCard>
            <nav aria-label="后台底部导航" className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回首页
                </Link>
                <Link href="/admin/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回总后台
                </Link>
              </div>
            </nav>

          </div>
        );
      }}
    </AdminAuthGate>
  );
}

function normalizePage(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}
