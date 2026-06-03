import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bell,
  Briefcase,
  ChevronDown,
  Home,
  PlusSquare,
  Share2,
  ShoppingBag,
} from "lucide-react";
import { ProfileLogoutButton } from "@/components/profile/ProfileLogoutButton";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的",
  description: "OpenAA 我的页面，管理发布、收藏、导航和账号资料。",
  path: "/profile",
  noIndex: true,
});

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  let profile: Profile | null = null;
  let profileWarning = false;

  if (user) {
    try {
      profile = (await ensureProfileForUser(user)) as Profile;
    } catch (error) {
      console.error("[profile] ensureProfileForUser failed", error);
      profileWarning = true;
    }
  }

  return (
    <div className="-mx-4 -mt-4 min-h-[calc(100dvh-8rem)] bg-zinc-100 px-4 pb-24 pt-6">
      <div className="mx-auto w-full max-w-[560px] space-y-4 md:max-w-[760px] lg:max-w-[960px] xl:max-w-[1040px]">
        <div className="px-1">
          <h1 className="text-[18px] font-black tracking-tight text-zinc-900">OpenAA 用户中心</h1>
          <p className="mt-1 text-[12px] text-zinc-500">管理我的信息与发布入口</p>
        </div>

        {profileWarning ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            登录成功，资料正在补全中。你可以先继续使用个人中心，稍后刷新再试。
          </div>
        ) : null}

        {profile ? <ProfileHeader profile={profile} email={user?.email ?? ""} /> : <GuestHeader />}

        <section className="px-1 space-y-3">
          <h2 className="text-[14px] font-black tracking-tight text-zinc-900">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3 max-[359px]:grid-cols-1">
            <QuickAction
              href="/offline"
              eyebrow="OpenAA"
              title="添加到桌面"
              icon={<PlusSquare size={18} className="text-blue-600" aria-hidden="true" />}
              tone="blue"
            />
            <QuickAction
              href="/"
              eyebrow="OpenAA"
              title="分享给朋友"
              icon={<Share2 size={17} className="text-orange-500" aria-hidden="true" />}
              tone="orange"
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          <div className="grid grid-cols-2 border-b border-zinc-100">
            <MenuCard
              href="/profile/favorites"
              title="我的收藏"
              description="查看你收藏的招聘、房屋、二手、服务和新闻"
              className="border-r border-zinc-100"
            />
            <MenuCard href="/profile/recent" title="最近浏览" description="查看你最近看过的内容" />
          </div>

          <MenuRow
            href="/profile/notifications"
            title="通知中心"
            description="查看账号、内容和平台相关通知"
            icon={
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                <Bell size={17} className="text-blue-600" aria-hidden="true" />
              </span>
            }
          />
          <MenuRow href="/navigation/my" title="🧭 管理我的导航" description="添加和整理自己的常用网站" />

          <details className="border-b border-zinc-100">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 transition hover:bg-zinc-50">
              <span className="flex items-center gap-2">
                <span className="font-medium text-zinc-900">🚀 我要发布</span>
                <span className="text-[11px] text-zinc-400">招聘 / 房屋 / 二手 / 服务</span>
              </span>
              <ChevronDown size={18} className="text-zinc-400" aria-hidden="true" />
            </summary>
            <div className="border-t border-zinc-100 px-4 pb-4 pt-2">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <PublishCard href="/jobs/publish" title="发布招聘" subtitle="去发布职位" icon={<Briefcase size={18} className="text-blue-600" />} tone="blue" />
                <PublishCard href="/housing/publish" title="发布房屋" subtitle="去发布房源" icon={<Home size={18} className="text-emerald-600" />} tone="emerald" />
                <PublishCard href="/marketplace/publish" title="发布二手" subtitle="去发布商品" icon={<ShoppingBag size={18} className="text-amber-600" />} tone="amber" />
                <PublishCard href="/services/publish" title="发布服务" subtitle="去发布服务" icon={<span className="text-base leading-none">🛠️</span>} tone="cyan" />
              </div>
            </div>
          </details>

          <div className="grid grid-cols-2 border-b border-zinc-100">
            <MenuTile href="/profile/jobs" label="💼 我的招聘" className="border-r border-zinc-100" />
            <MenuTile href="/profile/housing" label="🏠 我的房屋" />
            <MenuTile href="/profile/marketplace" label="🛍️ 我的二手" className="border-r border-t border-zinc-100" />
            <MenuTile href="/profile/services" label="🛠️ 我的服务" className="border-t border-zinc-100" />
          </div>

          <MenuRow href="/feedback" title="📝 反馈与举报" description="提交问题、举报虚假信息或提出建议" />
          <MenuRow href="/profile/edit" title="✏️ 编辑资料" />

          {profile ? <ProfileLogoutButton variant="legacy" /> : <div className="p-4 text-[12px] text-zinc-400">登录后可使用更多功能</div>}
        </section>

        <section className="space-y-3 pb-4">
          <Link
            href="/news?category=announcement"
            className="block rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-center transition hover:bg-blue-100"
          >
            <p className="text-[14px] font-bold text-blue-700">平台公告</p>
            <p className="mt-1 text-[12px] text-blue-500">查看 OpenAA 最新规则与更新</p>
          </Link>
          <Link
            href="/contact"
            className="block rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-center transition hover:bg-blue-100"
          >
            <p className="text-[14px] font-bold text-blue-700">关于 OpenAA</p>
          </Link>
        </section>
      </div>
    </div>
  );
}

function ProfileHeader({ profile, email }: { profile: Profile; email: string }) {
  const username = profile.nickname || profile.email?.split("@")[0] || email.split("@")[0] || "用户";

  return (
    <section className="rounded-[24px] border border-zinc-100 bg-white px-5 py-5 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="relative mx-auto mb-2 h-[76px] w-[76px] overflow-hidden rounded-full">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={username} fill className="object-cover" />
        ) : (
          <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#1976d2] text-[22px] font-bold text-white">
            {username[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>
      <h2 className="text-lg font-bold leading-tight text-gray-900">{username}</h2>
      <p className="mt-1 text-sm leading-tight text-gray-500">{profile.email || email}</p>
      {profile.bio ? <p className="mt-1.5 text-sm leading-tight text-gray-600">{profile.bio}</p> : null}
      {profile.phone ? <p className="mt-1.5 text-sm leading-tight text-gray-500">📞 {profile.phone}</p> : null}
    </section>
  );
}

function GuestHeader() {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-black text-zinc-900">未登录</div>
          <div className="mt-0.5 text-[11px] text-zinc-500">登录后可管理发布与个人信息</div>
        </div>
        <Link href="/login?returnTo=/profile" className="rounded-2xl bg-zinc-900 px-4 py-2 text-[13px] font-bold text-white">
          登录
        </Link>
      </div>
    </section>
  );
}

function QuickAction({
  href,
  eyebrow,
  title,
  icon,
  tone,
}: {
  href: string;
  eyebrow: string;
  title: string;
  icon: ReactNode;
  tone: "blue" | "orange";
}) {
  const color = tone === "blue" ? "border-blue-100 bg-blue-50" : "border-orange-100 bg-orange-50";

  return (
    <Link
      href={href}
      className={`rounded-2xl border bg-white p-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition active:scale-[0.98] ${tone === "blue" ? "border-blue-100" : "border-orange-100"}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm">{icon}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-bold leading-tight text-blue-600">{eyebrow}</div>
          <div className="mt-1 text-[13px] font-semibold leading-tight text-slate-900">{title}</div>
        </div>
      </div>
    </Link>
  );
}

function MenuCard({ href, title, description, className = "" }: { href: string; title: string; description: string; className?: string }) {
  return (
    <Link href={href} className={`min-w-0 p-4 transition hover:bg-zinc-50 ${className}`}>
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-500">{description}</p>
    </Link>
  );
}

function MenuRow({ href, title, description, icon }: { href: string; title: string; description?: string; icon?: ReactNode }) {
  return (
    <Link href={href} className="flex w-full items-center justify-between gap-3 border-b border-zinc-100 p-4 transition hover:bg-zinc-50">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          {description ? <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">{description}</p> : null}
        </div>
      </div>
      <span className="shrink-0 text-zinc-300">›</span>
    </Link>
  );
}

function MenuTile({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center justify-between p-4 transition hover:bg-zinc-50 ${className}`}>
      <span className="text-zinc-900">{label}</span>
      <span className="text-zinc-300">›</span>
    </Link>
  );
}

function PublishCard({
  href,
  title,
  subtitle,
  icon,
  tone,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  tone: "blue" | "emerald" | "amber" | "cyan";
}) {
  const toneClass = {
    blue: "bg-blue-50 ring-blue-100",
    emerald: "bg-emerald-50 ring-emerald-100",
    amber: "bg-amber-50 ring-amber-100",
    cyan: "bg-cyan-50 ring-cyan-100",
  }[tone];

  return (
    <Link href={href} className="rounded-2xl bg-zinc-50 p-3 text-left ring-1 ring-zinc-100 transition hover:bg-white hover:ring-zinc-200">
      <div className="flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${toneClass}`}>{icon}</div>
        <div>
          <div className="text-[13px] font-black text-zinc-900">{title}</div>
          <div className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</div>
        </div>
      </div>
    </Link>
  );
}
