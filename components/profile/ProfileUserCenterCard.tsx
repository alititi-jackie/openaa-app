"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";

type ProfileUserCenterCardProps = {
  profile: Profile;
  authLines: string[];
  unreadNotifications: number;
  favorites: number;
  recent: number;
};

export function ProfileUserCenterCard({ profile, authLines, unreadNotifications, favorites, recent }: ProfileUserCenterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const username = profile.nickname || profile.email?.split("@")[0] || "用户";
  const filledItems = getFilledProfileItems(profile);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3 px-4 py-3">
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

      <div className="grid grid-cols-4 border-t border-zinc-100">
        <ProfileMetricButton label="我的资料" value={filledItems.length} expanded={expanded} onClick={() => setExpanded((current) => !current)} />
        <ProfileMetricLink href="/profile/notifications" label="通知" value={unreadNotifications} highlight={unreadNotifications > 0} />
        <ProfileMetricLink href="/profile/favorites" label="收藏" value={favorites} />
        <ProfileMetricLink href="/profile/recent" label="最近浏览" value={recent} />
      </div>

      {expanded ? <ProfileDetailsPanel profile={profile} filledItems={filledItems} /> : null}
    </section>
  );
}

function ProfileMetricButton({ label, value, expanded, onClick }: { label: string; value: number; expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="min-w-0 border-r border-zinc-100 bg-blue-50/60 px-1.5 py-3 text-center transition hover:bg-blue-50"
    >
      <div className="flex items-center justify-center gap-1 text-[18px] font-black leading-none text-[#1976d2]">
        {value}
        <ChevronDown size={13} className={`mt-0.5 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </div>
      <div className="mt-1 truncate text-[11px] font-bold leading-tight text-zinc-600">{label}</div>
    </button>
  );
}

function ProfileMetricLink({ href, label, value, highlight = false }: { href: string; label: string; value: number; highlight?: boolean }) {
  return (
    <Link href={href} className="min-w-0 border-r border-zinc-100 px-1.5 py-3 text-center transition last:border-r-0 hover:bg-zinc-50">
      <div className={`text-[18px] font-black leading-none ${highlight ? "text-red-600" : "text-zinc-900"}`}>{value}</div>
      <div className="mt-1 truncate text-[11px] font-bold leading-tight text-zinc-600">{label}</div>
    </Link>
  );
}

function ProfileDetailsPanel({ profile, filledItems }: { profile: Profile; filledItems: Array<{ label: string; value: string }> }) {
  const complete = isProfileComplete(profile);

  return (
    <div id="profile-details" className="border-t border-zinc-100 px-4 pb-4 pt-3">
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
    </div>
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
