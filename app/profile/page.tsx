import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Clock,
  Compass,
  FileText,
  HeartHandshake,
  Home,
  KeyRound,
  Mail,
  Pencil,
  Send,
  ShoppingBag,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
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

  if (!supabase) {
    return (
      <PageShell title="我的" description="登录后可以管理发布、收藏、我的导航和账号资料。" eyebrow="Profile">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">登录暂不可用</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Supabase 环境变量尚未配置。配置新 Supabase 后，这里会进入登录保护的用户中心。</p>
        </section>
      </PageShell>
    );
  }

  if (!user) {
    redirect("/login?returnTo=/profile");
  }

  const profile = (await ensureProfileForUser(user)) as Profile;
  const displayName = profile.nickname || profile.email?.split("@")[0] || user.email?.split("@")[0] || "OpenAA 用户";

  return (
    <PageShell title="我的" description="管理你的发布、资料、收藏和常用入口。" eyebrow="Profile">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-xl font-black text-slate-500">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={displayName} width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-black text-slate-950">{displayName}</h2>
            <p className="mt-1 truncate text-sm text-slate-600">{profile.email || user.email || "未绑定邮箱"}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">已登录</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">账号状态：{profile.status}</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                {profile.account_type === "business" ? "商家账号" : "个人账号"}
              </span>
            </div>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 text-sm">
          <InfoRow label="手机" value={profile.phone} />
          <InfoRow label="微信" value={profile.wechat_id} />
          <InfoRow label="WhatsApp" value={profile.whatsapp} />
          <InfoRow label="偏好联系方式" value={profile.preferred_contact_method} />
          <InfoRow label="所在区域" value={profile.location_area} />
        </dl>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/profile/edit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
          >
            <Pencil size={17} aria-hidden="true" />
            编辑资料
          </Link>
          <Link
            href="/profile/security"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900"
          >
            <KeyRound size={17} aria-hidden="true" />
            账号安全
          </Link>
          <ProfileLogoutButton />
        </div>
      </section>

      <PublishPanel />

      <section className="grid gap-3 sm:grid-cols-2">
        <Entry icon={<FileText size={18} />} title="我的发布" description="查看所有招聘、房屋、市场和服务内容。" href="/profile/posts" />
        <Entry icon={<BriefcaseBusiness size={18} />} title="我的招聘" description="管理我发布的招聘或求职信息。" href="/profile/jobs" />
        <Entry icon={<Home size={18} />} title="我的房屋" description="管理我发布的租房、求租和房屋信息。" href="/profile/housing" />
        <Entry icon={<ShoppingBag size={18} />} title="我的二手/市场" description="管理我发布的二手和市场信息。" href="/profile/marketplace" />
        <Entry icon={<HeartHandshake size={18} />} title="我的服务" description="管理我发布的本地服务信息。" href="/profile/services" />
        <Entry icon={<Compass size={18} />} title="我的导航" description="保存和管理常用网站入口。" href="/navigation/my" />
        <Entry icon={<Bookmark size={18} />} title="我的收藏" description="查看收藏入口，完整列表后续接入。" href="/profile/favorites" badge="入口" />
        <Entry icon={<Clock size={18} />} title="最近浏览" description="查看最近浏览入口，历史记录后续接入。" href="/profile/recent" badge="入口" />
        <Entry icon={<Bell size={18} />} title="我的通知" description="查看平台通知入口，通知中心后续接入。" href="/profile/notifications" badge="入口" />
        <Entry icon={<Mail size={18} />} title="反馈/联系平台" description="提交问题、建议或联系平台。" href="/feedback" />
      </section>
    </PageShell>
  );
}

function PublishPanel() {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Send size={18} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-black text-slate-950">我要发布</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">选择要发布的内容类型，填写后即可进入对应频道。</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <PublishLink href="/jobs/publish" label="发布招聘" />
        <PublishLink href="/housing/publish" label="发布房屋" />
        <PublishLink href="/marketplace/publish" label="发布二手/市场" />
        <PublishLink href="/services/publish" label="发布服务" />
      </div>
    </section>
  );
}

function PublishLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-xl bg-slate-50 px-3 py-3 text-center text-sm font-black text-slate-800">
      {label}
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
      <dt className="shrink-0 font-bold text-slate-700">{label}</dt>
      <dd className="min-w-0 truncate text-right text-slate-600">{value || "未填写"}</dd>
    </div>
  );
}

function Entry({
  icon,
  title,
  description,
  href,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  badge?: string;
}) {
  const className = "flex h-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm";
  const content = (
    <>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-700">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black text-slate-950">{title}</h3>
          {badge ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{badge}</span> : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
