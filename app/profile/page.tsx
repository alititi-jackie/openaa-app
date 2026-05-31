import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Bookmark, FileText, Pencil, Send } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ensureProfileForUser } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的资料",
  description: "OpenAA 用户资料。",
  path: "/profile",
  noIndex: true,
});

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <PageShell
        title="我的资料"
        description="Supabase 环境变量尚未配置。配置新 Supabase 后，这里会读取当前登录用户资料。"
        eyebrow="Profile"
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnTo=/profile");
  }

  const profile = (await ensureProfileForUser(user)) as Profile;

  return (
    <PageShell title="我的资料" description="查看账号状态、联系方式和后续个人中心入口。" eyebrow="Profile">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-xl font-black text-slate-500">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.nickname || "头像"} width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              (profile.nickname || profile.email || "O").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-black text-slate-950">{profile.nickname || "未设置昵称"}</h2>
            <p className="mt-1 truncate text-sm text-slate-600">{profile.email || user.email || "未绑定邮箱"}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">状态：{profile.status}</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                {profile.account_type === "business" ? "Business account" : "Personal account"}
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

        <Link
          href="/profile/edit"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          <Pencil size={17} aria-hidden="true" />
          编辑资料
        </Link>
      </section>

      <section className="grid gap-3">
        <Entry icon={<Send size={18} />} title="我的发布" description="后续 Phase 接入发布内容列表。" />
        <Entry icon={<Bookmark size={18} />} title="我的收藏" description="后续 Phase 接入收藏内容。" />
        <Entry icon={<Bell size={18} />} title="通知" description="后续 Phase 接入站内通知。" />
        <Entry icon={<FileText size={18} />} title="草稿" description="后续 Phase 接入草稿入口。" />
      </section>
    </PageShell>
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

function Entry({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-700">{icon}</div>
      <div>
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
