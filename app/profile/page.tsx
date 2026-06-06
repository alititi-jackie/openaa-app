import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Briefcase,
  ChevronDown,
  Home,
  PlusSquare,
  ShoppingBag,
} from "lucide-react";
import { ProfileLogoutButton } from "@/components/profile/ProfileLogoutButton";
import { ProfileShareButton } from "@/components/profile/ProfileShareButton";
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
  let profileCounts = { unreadNotifications: 0, favorites: 0, recent: 0 };

  if (user) {
    try {
      profile = (await ensureProfileForUser(user)) as Profile;
      profileCounts = await getProfileCounts(user.id);
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

        {profile ? <ProfileHeader profile={profile} user={user} /> : <GuestHeader />}

        {profile ? (
          <>
            <ProfileOverviewBar
              profile={profile}
              unreadNotifications={profileCounts.unreadNotifications}
              favorites={profileCounts.favorites}
              recent={profileCounts.recent}
            />
            <ProfileDetailsPanel profile={profile} />
          </>
        ) : null}

        <section className="px-1 space-y-3">
          <h2 className="text-[14px] font-black tracking-tight text-zinc-900">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3 max-[359px]:grid-cols-1">
            <QuickAction
              href="/app"
              eyebrow="OpenAA"
              title="添加到桌面"
              icon={<PlusSquare size={18} className="text-blue-600" aria-hidden="true" />}
              tone="blue"
            />
            <ProfileShareButton />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          <MenuRow href="/navigation/my" title="🧭 管理我的导航" description="添加和整理自己的常用网站" />

          <details className="group border-b border-zinc-100 open:m-2 open:overflow-hidden open:rounded-2xl open:border open:border-[#1976d2] open:bg-white">
            <summary className="m-2 flex cursor-pointer list-none items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-4 transition hover:bg-blue-50 group-open:m-0 group-open:rounded-none group-open:border-0 group-open:bg-white group-open:hover:bg-zinc-50">
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
          <MenuRow href="/profile/security" title="账号安全 / 修改密码" />

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

async function getProfileCounts(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { unreadNotifications: 0, favorites: 0, recent: 0 };
  }

  const [notifications, favorites, recent] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
    supabase.from("post_favorites").select("post_id").eq("user_id", userId).limit(200),
    supabase.from("post_views").select("post_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
  ]);

  return {
    unreadNotifications: notifications.count ?? 0,
    favorites: countUniquePostIds(favorites.data as Array<{ post_id: string | null }> | null),
    recent: countUniquePostIds(recent.data as Array<{ post_id: string | null }> | null),
  };
}

function countUniquePostIds(rows: Array<{ post_id: string | null }> | null) {
  return new Set((rows ?? []).map((row) => row.post_id).filter(Boolean)).size;
}

function ProfileHeader({ profile, user }: { profile: Profile; user: User | null }) {
  const email = user?.email ?? profile.email ?? "";
  const username = profile.nickname || profile.email?.split("@")[0] || email.split("@")[0] || "用户";
  const authLines = getAuthLines(user, email);

  return (
    <section className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={username} fill className="object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1976d2] text-[20px] font-bold text-white">
              {username[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-black leading-tight text-gray-900">{username}</h2>
          <div className="mt-1 space-y-0.5">
            {authLines.map((line) => (
              <p key={line} className="truncate text-[12px] leading-tight text-gray-500">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function getAuthLines(user: User | null, email: string) {
  const providers = new Set((user?.identities ?? []).map((identity) => identity.provider));
  const primaryProvider = typeof user?.app_metadata?.provider === "string" ? user.app_metadata.provider : "";
  if (primaryProvider) providers.add(primaryProvider);

  const lines: string[] = [];
  if (email && (providers.has("email") || !providers.has("google"))) {
    lines.push(`邮箱登录：${email}`);
  }
  if (providers.has("google")) {
    lines.push("Google 登录：已绑定");
  }

  return lines.length > 0 ? lines : ["账号信息：已登录"];
}

function ProfileOverviewBar({
  profile,
  unreadNotifications,
  favorites,
  recent,
}: {
  profile: Profile;
  unreadNotifications: number;
  favorites: number;
  recent: number;
}) {
  return (
    <section className="grid grid-cols-4 overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
      <ProfileMetric href="#profile-details" label="我的资料" value={getFilledProfileItems(profile).length} active />
      <ProfileMetric href="/profile/notifications" label="通知" value={unreadNotifications} />
      <ProfileMetric href="/profile/favorites" label="收藏" value={favorites} />
      <ProfileMetric href="/profile/recent" label="最近浏览" value={recent} />
    </section>
  );
}

function ProfileMetric({ href, label, value, active = false }: { href: string; label: string; value: number; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`min-w-0 border-r border-zinc-100 px-1.5 py-3 text-center last:border-r-0 transition hover:bg-zinc-50 ${active ? "bg-blue-50/60" : "bg-white"}`}
    >
      <div className={`text-[18px] font-black leading-none ${active ? "text-[#1976d2]" : "text-zinc-900"}`}>{value}</div>
      <div className="mt-1 truncate text-[11px] font-bold leading-tight text-zinc-600">{label}</div>
    </Link>
  );
}

function ProfileDetailsPanel({ profile }: { profile: Profile }) {
  const filledItems = getFilledProfileItems(profile);
  const complete = isProfileComplete(profile);

  return (
    <section id="profile-details" className="scroll-mt-20 rounded-2xl bg-white p-4 shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-black tracking-tight text-zinc-900">我的资料</h2>
        <Link href="/profile/edit" className="shrink-0 text-[12px] font-black text-[#1976d2]">
          修改资料
        </Link>
      </div>

      {filledItems.length > 0 ? (
        <dl className="mt-3 divide-y divide-zinc-100">
          {filledItems.map((item) => (
            <div key={item.label} className="grid grid-cols-[92px_1fr] gap-3 py-2.5 text-[13px] leading-5">
              <dt className="font-bold text-zinc-500">{item.label}</dt>
              <dd className="min-w-0 whitespace-pre-wrap break-words text-zinc-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-[13px] leading-6 text-zinc-500">还没有填写发布联系资料。</p>
      )}

      {!complete ? (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
          <p className="text-[12px] leading-5 text-slate-600">资料还不够完善，完善资料后，发布信息时可自动填写联系人、电话、微信和地区。</p>
          <Link
            href="/profile/edit"
            className="mt-2 inline-flex min-h-9 items-center justify-center rounded-xl border border-blue-200 bg-white px-3 text-[12px] font-black text-[#1976d2] hover:bg-blue-50"
          >
            去完善资料
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function getFilledProfileItems(profile: Profile) {
  const items: Array<{ label: string; value: string }> = [];

  addProfileItem(items, "发布联系人", profile.default_publish_contact_name);
  addProfileItem(items, "手机", profile.phone);
  addProfileItem(items, "微信", profile.wechat_id);
  addProfileItem(items, "发布邮箱", getPublishEmailLabel(profile));
  addProfileItem(items, "所在区域", profile.location_area);
  addProfileItem(items, "偏好联系方式", getPreferredContactLabel(profile.preferred_contact_method));
  addProfileItem(items, "简介", profile.bio);

  return items.slice(0, 7);
}

function addProfileItem(items: Array<{ label: string; value: string }>, label: string, value: string | null | undefined) {
  const trimmed = value?.trim();
  if (trimmed) {
    items.push({ label, value: trimmed });
  }
}

function getPublishEmailLabel(profile: Profile) {
  if (!profile.publish_email_mode) return "";
  if (profile.publish_email_mode === "hidden") return "不显示";
  if (profile.publish_email_mode === "account") return "显示账户邮箱";
  return profile.publish_email || "";
}

function getPreferredContactLabel(value: string | null) {
  if (value === "phone") return "手机";
  if (value === "wechat") return "微信";
  if (value === "email") return "邮箱";
  return "";
}

function isProfileComplete(profile: Profile) {
  return Boolean(
    profile.default_publish_contact_name?.trim() &&
      (profile.phone?.trim() || profile.wechat_id?.trim()) &&
      profile.location_area?.trim() &&
      profile.preferred_contact_method?.trim() &&
      profile.publish_email_mode?.trim(),
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
        <Link href="/login?returnTo=/profile" className="rounded-2xl bg-[#1976d2] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#1565c0]">
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
    <Link href={href} className="rounded-2xl bg-white p-3 text-left ring-1 ring-zinc-100 transition hover:bg-zinc-50 hover:ring-zinc-200">
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
