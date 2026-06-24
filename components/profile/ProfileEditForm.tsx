"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Upload } from "lucide-react";
import { LocationSelect } from "@/components/forms/LocationSelect";
import { ProfileCompletionHint } from "@/components/forms/ProfileCompletionHint";
import { validateNicknameForSave } from "@/features/auth/actions";
import { unavailableNicknameMessage, validateNickname } from "@/features/auth/nicknameValidation";
import { profileNeedsPublishDefaultsTip } from "@/features/posts/formMappers";
import { featureFlags } from "@/lib/config/featureFlags";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccountType, BusinessProfile, Profile } from "@/lib/supabase/types";

type ProfileEditFormProps = {
  userId: string;
  initialProfile: Profile;
  initialBusinessProfile: BusinessProfile | null;
  canUseReservedNickname?: boolean;
};

async function compressAvatar(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = objectUrl;
    });
    const size = 512;
    const scale = Math.max(size / image.width, size / image.height);
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    context?.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
    return blob ? new File([blob], "avatar.webp", { type: "image/webp" }) : file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ProfileEditForm({ userId, initialProfile, initialBusinessProfile, canUseReservedNickname = false }: ProfileEditFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initialProfile.avatar_url ?? "");
  const [profile, setProfile] = useState({
    nickname: initialProfile.nickname ?? "",
    avatar_url: initialProfile.avatar_url ?? "",
    phone: initialProfile.phone ?? "",
    wechat_id: initialProfile.wechat_id ?? "",
    preferred_contact_method: ["phone", "wechat", "email"].includes(initialProfile.preferred_contact_method ?? "")
      ? (initialProfile.preferred_contact_method ?? "")
      : "",
    default_publish_contact_name: initialProfile.default_publish_contact_name ?? "",
    publish_email_mode: initialProfile.publish_email_mode ?? "hidden",
    publish_email: initialProfile.publish_email ?? "",
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
  const liveNicknameResult = profile.nickname.trim()
    ? validateNickname(profile.nickname, { allowReservedNicknames: canUseReservedNickname })
    : null;
  const showProfileCompletionHint = profileNeedsPublishDefaultsTip({
    default_publish_contact_name: profile.default_publish_contact_name,
    phone: profile.phone,
    wechat_id: profile.wechat_id,
    location_area: profile.location_area,
  });

  function updateProfileField(key: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    try {
      const compressed = await compressAvatar(file);
      setAvatarFile(compressed);
      setAvatarPreview(URL.createObjectURL(compressed));
    } catch {
      setMessage("头像处理失败，请换一张图片再试。");
    }
  }

  function updateBusinessField(key: keyof typeof business, value: string) {
    setBusiness((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaved(false);
    setIsSubmitting(true);
    const nicknameResult = validateNickname(profile.nickname, { allowReservedNicknames: canUseReservedNickname });

    if (!nicknameResult.ok) {
      setMessage(nicknameResult.message);
      setIsSubmitting(false);
      return;
    }

    try {
      const serverNicknameResult = await validateNicknameForSave(profile.nickname, { allowCurrentAdminReservedNickname: true });

      if (!serverNicknameResult.ok) {
        setMessage(serverNicknameResult.message);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      let avatarUrl = profile.avatar_url || null;

      if (avatarFile) {
        const path = `${userId}/avatar.webp`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, {
          contentType: avatarFile.type,
          upsert: true,
        });

        if (uploadError) {
          setMessage("头像上传失败，请稍后再试。");
          return;
        }

        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nickname: serverNicknameResult.nickname,
          avatar_url: avatarUrl,
          phone: profile.phone || null,
          wechat_id: profile.wechat_id || null,
          preferred_contact_method: profile.preferred_contact_method || null,
          default_publish_contact_name: profile.default_publish_contact_name || null,
          publish_email_mode: profile.publish_email_mode || "hidden",
          publish_email: profile.publish_email_mode === "custom" ? profile.publish_email || null : null,
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

      setProfile((current) => ({ ...current, avatar_url: avatarUrl ?? "" }));
      setAvatarPreview(avatarUrl ?? "");
      setAvatarFile(null);
      setMessage("资料已保存。");
      setIsSaved(true);
      window.setTimeout(() => {
        router.push("/profile");
      }, 1800);
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
          {showProfileCompletionHint ? (
            <ProfileCompletionHint message="完善资料后，发布招聘、房屋、二手和本地服务时可自动填写联系方式和地区。" />
          ) : null}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="用户头像" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-black text-slate-400">
                  {(profile.nickname || "O").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-black text-blue-700 hover:bg-blue-50">
              <Upload size={16} aria-hidden="true" />
              更换头像
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => onAvatarChange(event.target.files?.[0] ?? null)} />
            </label>
          </div>
          <Field
            label="用户名"
            value={profile.nickname}
            onChange={(value) => updateProfileField("nickname", value)}
            error={liveNicknameResult?.ok === false && liveNicknameResult.message === unavailableNicknameMessage ? unavailableNicknameMessage : undefined}
          />
          <Field label="手机" value={profile.phone} onChange={(value) => updateProfileField("phone", value)} />
          <Field label="微信" value={profile.wechat_id} onChange={(value) => updateProfileField("wechat_id", value)} />
          <label className="block">
            <span className="text-sm font-bold text-slate-800">偏好联系方式</span>
            <select
              value={profile.preferred_contact_method}
              onChange={(event) => updateProfileField("preferred_contact_method", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">未指定</option>
              <option value="phone">手机</option>
              <option value="wechat">微信</option>
              <option value="email">邮箱</option>
            </select>
          </label>
          <Field label="发布信息联系人" value={profile.default_publish_contact_name} onChange={(value) => updateProfileField("default_publish_contact_name", value)} />
          <label className="block">
            <span className="text-sm font-bold text-slate-800">发布邮箱设置</span>
            <select
              value={profile.publish_email_mode}
              onChange={(event) => updateProfileField("publish_email_mode", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="hidden">不显示邮箱</option>
              <option value="account">显示账户邮箱</option>
              <option value="custom">使用其它邮箱</option>
            </select>
          </label>
          {profile.publish_email_mode === "custom" ? (
            <Field label="发布邮箱" value={profile.publish_email} onChange={(value) => updateProfileField("publish_email", value)} />
          ) : null}
          <label className="block">
            <span className="text-sm font-bold text-slate-800">所在区域</span>
            <div className="mt-2">
              <LocationSelect value={profile.location_area} onChange={(value) => updateProfileField("location_area", value)} required={false} />
            </div>
          </label>
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

      {message ? (
        <p className={`rounded-xl p-3 text-sm leading-6 ${isSaved ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || isSaved}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1976d2] px-4 py-3 text-sm font-black text-white hover:bg-[#1565c0] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Save size={18} aria-hidden="true" />
        {isSubmitting ? "保存中..." : "保存资料"}
      </button>

      <Link
        href="/profile"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
      >
        返回我的页面
      </Link>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
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
      {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
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
