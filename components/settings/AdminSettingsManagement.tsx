"use client";

import { Gauge, Globe, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminActionForm, AdminCheckbox, AdminTextInput } from "@/components/admin/AdminActionForm";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import { updateDailyPostLimit, updateDefaultPlaceholderImage } from "@/features/settings/adminActions";
import type { AdminSettingsData, AdminSiteSetting } from "@/features/settings/adminQueries";
import type { DefaultPlaceholderImageKey, DefaultPlaceholderImageValue } from "@/features/settings/defaultPlaceholderImages";

export function AdminSettingsPermissionBadges({ canManageSettings }: { canManageSettings: boolean }) {
  return <AdminPermissionBadge allowed={canManageSettings} label="manage_settings" />;
}

export function AdminSettingsSummary({ data }: { data: AdminSettingsData }) {
  const publicCount = data.settings.filter((setting) => setting.isPublic).length;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard icon={<Gauge size={17} aria-hidden="true" />} label="每日发布上限" value={`${data.dailyPostLimit} 条`} />
      <StatCard icon={<Settings2 size={17} aria-hidden="true" />} label="设置项" value={String(data.settings.length)} />
      <StatCard icon={<Globe size={17} aria-hidden="true" />} label="公开设置" value={String(publicCount)} />
    </div>
  );
}

export function DailyPostLimitForm({ dailyPostLimit }: { dailyPostLimit: number }) {
  return (
    <AdminActionForm action={updateDailyPostLimit} submitLabel="保存设置">
      <AdminTextInput label="每日发布上限" name="daily_post_limit" type="number" defaultValue={dailyPostLimit} required />
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
        每个账号每天最多可发布的信息总数。允许范围：1~100。保存后会写入 site_settings，并记录 admin_audit_logs。
      </p>
    </AdminActionForm>
  );
}

export function DefaultPlaceholderImagesForm({ images }: { images: AdminSettingsData["placeholderImages"] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {images.map((item) => (
        <PlaceholderImageForm key={item.key} settingKey={item.key} label={item.label} description={item.description} value={item.value} />
      ))}
    </div>
  );
}

export function AdminSiteSettingsList({ settings }: { settings: AdminSiteSetting[] }) {
  if (settings.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">暂无站点设置记录。</p>;
  }

  return (
    <div className="space-y-3">
      {settings.map((setting) => (
        <article key={setting.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">{setting.key}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${setting.isPublic ? "bg-blue-50 text-blue-700" : "bg-slate-200 text-slate-700"}`}>
                  {setting.isPublic ? "公开" : "后台"}
                </span>
              </div>
              {setting.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{setting.description}</p> : null}
              <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-700">
                {formatSettingValue(setting.value)}
              </pre>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{formatDateTime(setting.updatedAt)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-black text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-blue-700">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function PlaceholderImageForm({
  settingKey,
  label,
  description,
  value,
}: {
  settingKey: DefaultPlaceholderImageKey;
  label: string;
  description: string;
  value: DefaultPlaceholderImageValue;
}) {
  const [externalUrl, setExternalUrl] = useState(value.sourceType === "external" ? value.url ?? "" : "");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const externalPreview = useMemo(() => normalizePreviewUrl(externalUrl), [externalUrl]);
  const displayPreviewUrl = externalPreview.ok ? externalPreview.url : !externalUrl.trim() ? value.url : null;
  const previewAlt = externalPreview.ok ? `${label}外链预览` : label;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950">{label}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {value.sourceType ? (
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
            {value.sourceType === "storage" ? "上传图片" : "外链图片"}
          </span>
        ) : null}
      </div>

      {displayPreviewUrl ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayPreviewUrl}
            alt={previewAlt}
            className="aspect-[4/3] w-full object-cover"
            onLoad={() => setPreviewFailed(false)}
            onError={() => setPreviewFailed(true)}
          />
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-sm font-semibold text-slate-500">
          暂未设置默认占位图片。
        </p>
      )}
      {externalUrl.trim() && !externalPreview.ok ? (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700">
          {externalPreview.message}
        </p>
      ) : null}
      {previewFailed ? (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-600">
          图片预览加载失败，请检查图片地址是否可公开访问。
        </p>
      ) : null}

      <AdminActionForm action={updateDefaultPlaceholderImage} submitLabel="保存默认图片" className="mt-3 grid gap-3">
        <input type="hidden" name="setting_key" value={settingKey} />
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>外部图片链接</span>
          <input
            name="image_url"
            value={externalUrl}
            onChange={(event) => {
              setExternalUrl(event.target.value);
              setPreviewFailed(false);
            }}
            placeholder="https://img.openaa.com/..."
            className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          <span>上传图片</span>
          <input
            name="image_file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-slate-700 focus:border-blue-500"
          />
        </label>
        {selectedFileName ? (
          <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold leading-5 text-blue-700">
            已选择上传文件：{selectedFileName}。保存时会优先使用上传图片，外部链接将被忽略。
          </p>
        ) : null}
        <p className="rounded-xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
          上传图片和外链二选一；如果同时填写，优先使用上传图片。外链第一版只支持 https://img.openaa.com/。
        </p>
      </AdminActionForm>

      {value.url ? (
        <AdminActionForm action={updateDefaultPlaceholderImage} submitLabel="清除默认图片" className="mt-3">
          <input type="hidden" name="setting_key" value={settingKey} />
          <input type="hidden" name="remove_image" value="on" />
          <AdminCheckbox label="我确认清除这张默认占位图片" name="confirm_remove_image" />
        </AdminActionForm>
      ) : null}
    </div>
  );
}

function normalizePreviewUrl(raw: string): { ok: true; url: string } | { ok: false; message: string } {
  const value = raw.trim();
  if (!value) return { ok: false, message: "" };
  if (!value.startsWith("https://img.openaa.com/")) {
    return { ok: false, message: "外部图片链接必须以 https://img.openaa.com/ 开头。" };
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "img.openaa.com") {
      return { ok: false, message: "外部图片链接必须以 https://img.openaa.com/ 开头。" };
    }
    if (!/\.(png|jpe?g|webp)$/i.test(url.pathname)) {
      return { ok: false, message: "外部图片仅支持 png、jpg、jpeg、webp。" };
    }
    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false, message: "图片 URL 格式不正确。" };
  }
}

function formatSettingValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
