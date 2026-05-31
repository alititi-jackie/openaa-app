"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { featureFlags } from "@/lib/config/featureFlags";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccountType, BusinessProfile, Profile } from "@/lib/supabase/types";

type ProfileEditFormProps = {
  userId: string;
  initialProfile: Profile;
  initialBusinessProfile: BusinessProfile | null;
};

export function ProfileEditForm({ userId, initialProfile, initialBusinessProfile }: ProfileEditFormProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState({
    nickname: initialProfile.nickname ?? "",
    phone: initialProfile.phone ?? "",
    wechat_id: initialProfile.wechat_id ?? "",
    whatsapp: initialProfile.whatsapp ?? "",
    preferred_contact_method: initialProfile.preferred_contact_method ?? "email",
    bio: initialProfile.bio ?? "",
    location_area: initialProfile.location_area ?? "",
    account_type: initialProfile.account_type,
  });
  const [business, setBusiness] = useState({
    business_name: initialBusinessProfile?.business_name ?? "",
    business_category: initialBusinessProfile?.business_category ?? "",
    business_description: initialBusinessProfile?.business_profile ?? "",
    business_phone: initialBusinessProfile?.public_phone ?? "",
    business_wechat: initialBusinessProfile?.public_wechat ?? "",
    business_website: initialBusinessProfile?.website_url ?? "",
    business_address_text: initialBusinessProfile?.service_area ?? "",
  });

  function updateProfileField(key: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateBusinessField(key: keyof typeof business, value: string) {
    setBusiness((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nickname: profile.nickname || null,
          phone: profile.phone || null,
          wechat_id: profile.wechat_id || null,
          whatsapp: profile.whatsapp || null,
          preferred_contact_method: profile.preferred_contact_method || null,
          bio: profile.bio || null,
          location_area: profile.location_area || null,
          account_type: profile.account_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        setMessage("资料保存失败，请稍后再试。");
        return;
      }

      if (featureFlags.business_profiles_basic && profile.account_type === "business") {
        const { error: businessError } = await supabase.from("business_profiles").upsert(
          {
            user_id: userId,
            business_name: business.business_name || "未命名商家",
            business_category: business.business_category || null,
            business_profile: business.business_description || null,
            public_phone: business.business_phone || null,
            public_wechat: business.business_wechat || null,
            website_url: business.business_website || null,
            service_area: business.business_address_text || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (businessError) {
          setMessage("个人资料已保存，但商家资料保存失败。");
          return;
        }
      }

      setMessage("资料已保存。");
    } catch {
      setMessage("Supabase 环境变量尚未配置，暂时无法保存。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">基础资料</h2>
        <div className="mt-4 space-y-4">
          <Field label="昵称" value={profile.nickname} onChange={(value) => updateProfileField("nickname", value)} />
          <Field label="手机" value={profile.phone} onChange={(value) => updateProfileField("phone", value)} />
          <Field label="微信" value={profile.wechat_id} onChange={(value) => updateProfileField("wechat_id", value)} />
          <Field label="WhatsApp" value={profile.whatsapp} onChange={(value) => updateProfileField("whatsapp", value)} />
          <label className="block">
            <span className="text-sm font-bold text-slate-800">偏好联系方式</span>
            <select
              value={profile.preferred_contact_method}
              onChange={(event) => updateProfileField("preferred_contact_method", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="email">邮箱</option>
              <option value="phone">手机</option>
              <option value="wechat">微信</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          <Field label="所在区域" value={profile.location_area} onChange={(value) => updateProfileField("location_area", value)} />
          <TextArea label="简介" value={profile.bio} onChange={(value) => updateProfileField("bio", value)} />
          <label className="block">
            <span className="text-sm font-bold text-slate-800">账号类型</span>
            <select
              value={profile.account_type}
              onChange={(event) => updateProfileField("account_type", event.target.value as AccountType)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="personal">个人</option>
              <option value="business">商家</option>
            </select>
          </label>
        </div>
      </section>

      {featureFlags.business_profiles_basic && profile.account_type === "business" ? (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">商家资料</h2>
          <div className="mt-4 space-y-4">
            <Field label="商家名称" value={business.business_name} onChange={(value) => updateBusinessField("business_name", value)} />
            <Field
              label="商家分类"
              value={business.business_category}
              onChange={(value) => updateBusinessField("business_category", value)}
            />
            <TextArea
              label="商家介绍"
              value={business.business_description}
              onChange={(value) => updateBusinessField("business_description", value)}
            />
            <Field
              label="商家电话"
              value={business.business_phone}
              onChange={(value) => updateBusinessField("business_phone", value)}
            />
            <Field
              label="商家微信"
              value={business.business_wechat}
              onChange={(value) => updateBusinessField("business_wechat", value)}
            />
            <Field
              label="网站"
              value={business.business_website}
              onChange={(value) => updateBusinessField("business_website", value)}
            />
            <TextArea
              label="地址/服务区域"
              value={business.business_address_text}
              onChange={(value) => updateBusinessField("business_address_text", value)}
            />
          </div>
        </section>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Save size={18} aria-hidden="true" />
        {isSubmitting ? "保存中..." : "保存资料"}
      </button>

      {message ? <p className="rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-700">{message}</p> : null}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
