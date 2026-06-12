import Link from "next/link";
import {
  Bell,
  ClipboardList,
  Database,
  FileText,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  MessageSquareText,
  Newspaper,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { hasAdminPermission, isSuperAdmin } from "@/lib/permissions/admin";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "后台 Dashboard",
  description: "OpenAA 后台管理入口。",
  path: "/admin/dashboard",
  noIndex: true,
});

type AdminEntry = {
  id: string;
  title: string;
  description: string;
  href?: string;
  icon: React.ReactNode;
  permissionKeys: string[];
  status: "ready" | "planned";
};

type AdminEntryGroup = {
  title: string;
  description: string;
  entries: AdminEntry[];
};

const adminEntryGroups: AdminEntryGroup[] = [
  {
    title: "内容管理",
    description: "管理前台展示内容、用户发布内容和首页运营模块。",
    entries: [
      {
        id: "posts",
        title: "帖子管理",
        description: "统一管理招聘、房屋、市场和本地服务帖子，支持隐藏、恢复、待审和软删除。",
        href: "/admin/posts",
        icon: <ClipboardList size={20} aria-hidden="true" />,
        permissionKeys: ["view_posts", "moderate_posts"],
        status: "ready",
      },
      {
        id: "news",
        title: "新闻管理",
        description: "管理新闻分类、草稿、发布、下架、置顶、封面和 SEO 字段。",
        href: "/admin/news",
        icon: <Newspaper size={20} aria-hidden="true" />,
        permissionKeys: ["view_news", "create_news", "edit_news", "publish_news", "delete_news"],
        status: "ready",
      },
      {
        id: "services",
        title: "本地服务管理",
        description: "旧站独立服务后台；新站通过帖子管理里的服务筛选统一处理。",
        href: "/admin/posts?type=services",
        icon: <FileText size={20} aria-hidden="true" />,
        permissionKeys: ["view_posts", "moderate_posts"],
        status: "ready",
      },
      {
        id: "navigation",
        title: "导航管理",
        description: "管理公共导航分类、链接、推荐状态、启用状态和排序。",
        href: "/admin/navigation",
        icon: <LayoutGrid size={20} aria-hidden="true" />,
        permissionKeys: ["manage_navigation"],
        status: "ready",
      },
      {
        id: "top-links",
        title: "顶部快捷入口",
        description: "管理 Header 城市入口展开后的快捷导航。",
        href: "/admin/top-links",
        icon: <Home size={20} aria-hidden="true" />,
        permissionKeys: ["manage_top_links"],
        status: "ready",
      },
      {
        id: "home",
        title: "首页配置管理",
        description: "管理首页模块、ticker、Banner 和 home sections。",
        href: "/admin/home",
        icon: <Database size={20} aria-hidden="true" />,
        permissionKeys: ["manage_home_sections", "manage_latest_ticker", "manage_ads"],
        status: "ready",
      },
    ],
  },
  {
    title: "用户与安全",
    description: "管理用户状态、反馈、举报和站内通知。",
    entries: [
      {
        id: "users",
        title: "用户管理",
        description: "查看用户资料状态，管理 active / restricted / banned 等账号状态。",
        href: "/admin/users",
        icon: <Users size={20} aria-hidden="true" />,
        permissionKeys: ["view_users", "manage_user_status"],
        status: "ready",
      },
      {
        id: "admins",
        title: "管理员授权",
        description: "搜索真实用户后授予后台角色，管理管理员角色、停用和恢复。",
        href: "/admin/admins",
        icon: <Shield size={20} aria-hidden="true" />,
        permissionKeys: ["view_admins", "add_admins", "edit_admin_roles", "manage_admins"],
        status: "ready",
      },
      {
        id: "feedback",
        title: "反馈管理",
        description: "查看并处理用户提交的问题反馈、功能建议、内容举报和新闻线索。",
        href: "/admin/feedback",
        icon: <MessageSquareText size={20} aria-hidden="true" />,
        permissionKeys: ["view_feedback", "handle_feedback"],
        status: "ready",
      },
      {
        id: "reports",
        title: "举报管理",
        description: "处理帖子举报，并可联动帖子隐藏、恢复、待审和软删除。",
        href: "/admin/reports",
        icon: <Shield size={20} aria-hidden="true" />,
        permissionKeys: ["view_reports", "view_post_reports", "handle_reports", "handle_post_reports", "moderate_posts"],
        status: "ready",
      },
      {
        id: "notifications",
        title: "通知管理",
        description: "查看已发送站内通知、已读状态，并删除不再需要的通知记录。",
        href: "/admin/notifications",
        icon: <Bell size={20} aria-hidden="true" />,
        permissionKeys: ["manage_notifications"],
        status: "ready",
      },
    ],
  },
  {
    title: "运营设置",
    description: "管理广告、站点规则、图片维护和审计记录。",
    entries: [
      {
        id: "ads",
        title: "广告管理",
        description: "管理首页和频道页广告位、图片外链、跳转链接、起止时间和启用状态。",
        href: "/admin/ads",
        icon: <Megaphone size={20} aria-hidden="true" />,
        permissionKeys: ["manage_ads"],
        status: "ready",
      },
      {
        id: "settings",
        title: "站点设置",
        description: "管理每日发帖上限等基础站点规则，使用新站 admin_roles 权限和审计日志。",
        href: "/admin/settings",
        icon: <Settings size={20} aria-hidden="true" />,
        permissionKeys: ["manage_settings"],
        status: "ready",
      },
      {
        id: "image-cleanup",
        title: "图片清理工具",
        description: "扫描 image_assets 中疑似未使用的图片资产，管理员确认后标记删除。",
        href: "/admin/image-cleanup",
        icon: <ImageIcon size={20} aria-hidden="true" />,
        permissionKeys: ["view_images", "manage_image_assets"],
        status: "ready",
      },
      {
        id: "audit-logs",
        title: "审计日志",
        description: "查看后台操作记录和关键实体变更，方便上线后追溯。",
        href: "/admin/audit-logs",
        icon: <ScrollText size={20} aria-hidden="true" />,
        permissionKeys: ["view_admin_audit_logs", "view_audit_logs"],
        status: "ready",
      },
    ],
  },
];

export default function AdminDashboardPage() {
  return (
    <AdminAuthGate>
      {async ({ user, adminRole }) => {
        const permissions = await getDashboardPermissions();
        const superAdmin = await isSuperAdmin();
        const readyEntries = adminEntryGroups.flatMap((group) => group.entries).filter((entry) => entry.status === "ready");
        const accessibleReadyCount = readyEntries.filter((entry) => canAccessEntry(entry, permissions)).length;

        return (
          <div className="space-y-4">
            <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              返回首页
            </Link>

            <AdminPageHeader title="OpenAA 管理后台" description="集中管理内容、用户、安全反馈和运营配置。已完成模块可直接进入，旧站已有但新站尚未补齐的模块会标记为待补齐。">
              <AdminPermissionBadge allowed={superAdmin} label="super_admin" />
              <AdminPermissionBadge allowed={accessibleReadyCount > 0} label={`可进入 ${accessibleReadyCount}/${readyEntries.length}`} />
              <AdminPermissionBadge allowed={adminRole.is_active} label={adminRole.role} />
            </AdminPageHeader>

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Current Admin</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">{user.email ?? "未绑定邮箱"}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">角色：{adminRole.role} · 状态：{adminRole.is_active ? "active" : "inactive"}</p>
                </div>
                <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                  返回首页
                </Link>
              </div>
            </section>

            <div className="space-y-5">
              {adminEntryGroups.map((group) => (
                <section key={group.title} className="space-y-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{group.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{group.description}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.entries.map((entry) => (
                      <AdminEntryCard key={entry.id} entry={entry} allowed={canAccessEntry(entry, permissions)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

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

async function getDashboardPermissions() {
  const keys = Array.from(new Set(adminEntryGroups.flatMap((group) => group.entries.flatMap((entry) => entry.permissionKeys))));
  const results = await Promise.all(keys.map(async (key) => [key, await hasAdminPermission(key)] as const));
  return new Map(results);
}

function canAccessEntry(entry: AdminEntry, permissions: Map<string, boolean>) {
  return entry.permissionKeys.some((key) => permissions.get(key));
}

function AdminEntryCard({ entry, allowed }: { entry: AdminEntry; allowed: boolean }) {
  const ready = entry.status === "ready";
  const enabled = ready && allowed && entry.href;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${ready ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
          {entry.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-950">{entry.title}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {ready ? "已可用" : "待补齐"}
            </span>
            {ready && !allowed ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">无权限</span> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {enabled ? (
              <Link href={entry.href ?? "#"} className="inline-flex min-h-9 items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">
                进入
              </Link>
            ) : (
              <span className="inline-flex min-h-9 items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
                {ready ? "需要权限" : "后续补齐"}
              </span>
            )}
            <span className="inline-flex min-h-9 items-center rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
              {entry.permissionKeys.join(" / ")}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
