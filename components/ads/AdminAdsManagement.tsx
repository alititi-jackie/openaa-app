"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { deleteAd, toggleAdActive, upsertAd } from "@/features/ads/adminActions";
import { adPositions, adStatusFilters, type AdminAdRow, type AdOpenMode, type AdPosition, type AdStatusFilter } from "@/features/ads/types";
import type { AdminHomeActionState } from "@/features/admin-home/types";

const initialState: AdminHomeActionState = { ok: true, message: "" };

type ImageSourceLock = "uploaded" | "external";

export function AdminAdsManagement({
  ads,
  activePosition,
  activeStatus,
}: {
  ads: AdminAdRow[];
  activePosition: AdPosition;
  activeStatus: AdStatusFilter;
}) {
  const [editingAd, setEditingAd] = useState<AdminAdRow | null>(null);
  const [openMode, setOpenMode] = useState<AdOpenMode>("external_new");
  const [imageUrl, setImageUrl] = useState("");
  const [imageSourceLock, setImageSourceLock] = useState<ImageSourceLock | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [state, formAction, pending] = useActionState(upsertAd, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const trimmedImageUrl = imageUrl.trim();
  const hasImage = Boolean(trimmedImageUrl || filePreviewUrl);
  const previewUrl = filePreviewUrl || trimmedImageUrl;
  const uploadDisabled = Boolean(imageSourceLock && imageSourceLock !== "uploaded");
  const urlDisabled = Boolean(imageSourceLock && imageSourceLock !== "external");

  useEffect(() => {
    if (state.ok && state.message) {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, state.message]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  function resetForm() {
    setEditingAd(null);
    setOpenMode("external_new");
    setImageUrl("");
    setImageSourceLock(null);
    setUploadMessage("");
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(ad: AdminAdRow) {
    setEditingAd(ad);
    setOpenMode(ad.open_mode);
    setImageUrl(ad.image_url ?? "");
    setImageSourceLock(ad.image_url ? (ad.image_source_type === "storage" ? "uploaded" : "external") : null);
    setUploadMessage("");
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearImage() {
    setImageUrl("");
    setImageSourceLock(null);
    setUploadMessage("");
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageSourceLock === "external") {
      event.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadMessage("图片格式仅支持 JPG、PNG、WEBP");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage("图片大小不能超过 5MB");
      event.target.value = "";
      return;
    }
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(URL.createObjectURL(file));
    setImageUrl("");
    setImageSourceLock("uploaded");
    setUploadMessage("已选择上传图片");
  }

  function handleImageUrlBlur() {
    const value = imageUrl.trim();
    if (!value) {
      setImageSourceLock(null);
      setUploadMessage("");
      return;
    }
    if (!isHttpUrl(value)) {
      setUploadMessage("图片链接必须以 http:// 或 https:// 开头");
      return;
    }
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setImageUrl(value);
    setImageSourceLock("external");
    setUploadMessage("");
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <form ref={formRef} action={formAction} encType="multipart/form-data" className="scroll-mt-20 mb-8 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">{editingAd ? "编辑广告" : "新增广告"}</h2>
        <input type="hidden" name="id" value={editingAd?.id ?? ""} />
        <input type="hidden" name="image_asset_id" value={editingAd?.image_asset_id ?? ""} />
        <input type="hidden" name="sort_order" value={editingAd?.sort_order ?? 0} />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">位置</label>
          <select name="position" defaultValue={editingAd?.position ?? activePosition} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {adPositions.map((position) => (
              <option key={position.key} value={position.key}>{position.label.replace("广告", "")} ({position.key})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-700">广告图片 *</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className={`rounded-lg border px-3 py-2 text-sm font-medium ${uploadDisabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "cursor-pointer bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
              上传广告图
              <input ref={fileInputRef} name="image_file" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadDisabled} onChange={handleFileChange} />
            </label>
            {uploadMessage ? <span className={`text-xs ${uploadMessage.includes("已选择") ? "text-green-600" : "text-red-500"}`}>{uploadMessage}</span> : null}
          </div>
          <input
            name="image_url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            onBlur={handleImageUrlBlur}
            disabled={urlDisabled}
            placeholder="外部图片 URL（例如 https://img.openaa.com/banners/xxx.jpg）"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
          />
          {imageSourceLock ? (
            <p className="text-xs text-amber-700">
              {imageSourceLock === "uploaded" ? "已使用上传图片，如需改用外部链接，请先删除当前图片。" : "已使用外部图片链接，如需上传图片，请先删除当前图片。"}
            </p>
          ) : (
            <p className="text-xs text-slate-500">上传图片与外部链接二选一。若已存在图片，请先删除后再更换。推荐 1200x420 或 1500x500，建议使用 WebP/JPG，单张建议小于 500KB。</p>
          )}
          {hasImage ? (
            <button type="button" onClick={clearImage} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600">
              删除图片
            </button>
          ) : null}
          {previewUrl && isHttpUrl(previewUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="广告图预览" className="mt-2 max-h-40 rounded-lg object-cover" />
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">打开方式 (Open mode) *</label>
          <select name="open_mode" value={openMode} onChange={(event) => setOpenMode(event.target.value as AdOpenMode)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="internal">内部详情页</option>
            <option value="external_new">外部链接 - 新窗口</option>
            <option value="external_same">外部链接 - 当前窗口</option>
          </select>
        </div>

        {openMode !== "internal" ? <ExternalFields ad={editingAd} /> : <InternalFields ad={editingAd} />}

        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" name="is_active" defaultChecked={editingAd?.is_active ?? true} />
          <label htmlFor="is_active" className="text-sm font-medium text-slate-700">立即启用</label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateInput label="开始日期（可选）" name="start_date" defaultValue={editingAd?.start_date} />
          <DateInput label="结束日期（可选）" name="end_date" defaultValue={editingAd?.end_date} />
        </div>

        {state.message ? <p className={`text-sm ${state.ok ? "text-green-600" : "text-red-500"}`}>{state.message}</p> : null}

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white disabled:opacity-50">
            {pending ? "处理中..." : editingAd ? "保存修改" : "提交广告"}
          </button>
          {editingAd ? (
            <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              取消编辑
            </button>
          ) : null}
        </div>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-950">现有广告</h2>
        <AdsFilter activePosition={activePosition} activeStatus={activeStatus} />
        {ads.length === 0 ? <p className="mt-3 text-sm text-slate-400">暂无符合条件的广告</p> : null}
        <ul className="mt-3 space-y-3">
          {ads.map((ad) => (
            <AdListItem key={ad.id} ad={ad} onEdit={() => startEdit(ad)} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function InternalFields({ ad }: { ad: AdminAdRow | null }) {
  return (
    <>
      <Input label="页面标识 (slug) *" name="slug" defaultValue={ad?.slug} placeholder="e.g. summer-sale-2024" />
      <p className="-mt-3 text-xs text-slate-400">只能使用小写字母、数字和短横线，访问路径将为 /ads/你的标识</p>
      <Textarea label="详情内容（可选）" name="content" defaultValue={ad?.content} />
      <Input label="联系人（可选）" name="contact_name" defaultValue={ad?.contact_name} placeholder="请输入联系人" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="联系电话（可选）" name="phone" defaultValue={ad?.phone} placeholder="请输入联系电话" />
        <Input label="微信号（可选）" name="wechat" defaultValue={ad?.wechat} placeholder="请输入微信号" />
      </div>
    </>
  );
}

function ExternalFields({ ad }: { ad: AdminAdRow | null }) {
  return (
    <div>
      <Input label="外部链接地址 *" name="external_url" type="url" defaultValue={ad?.external_url} placeholder="https://example.com" />
      <p className="mt-1 text-xs text-slate-400">必须以 http:// 或 https:// 开头。</p>
    </div>
  );
}

function AdsFilter({ activePosition, activeStatus }: { activePosition: AdPosition; activeStatus: AdStatusFilter }) {
  return (
    <div className="space-y-2">
      <div className="-mx-1 overflow-x-auto overflow-y-hidden py-1 [touch-action:pan-x] [overscroll-behavior-x:contain] [overscroll-behavior-y:contain]">
        <div className="flex flex-nowrap gap-2 px-1 whitespace-nowrap">
          {adPositions.map((item) => (
            <FilterLink key={item.key} href={`/admin/ads?position=${item.key}&status=${activeStatus}`} active={activePosition === item.key}>
              {item.label}
            </FilterLink>
          ))}
        </div>
      </div>
      <div className="-mx-1 overflow-x-auto overflow-y-hidden py-1 [touch-action:pan-x] [overscroll-behavior-x:contain] [overscroll-behavior-y:contain]">
        <div className="flex flex-nowrap gap-2 px-1 whitespace-nowrap">
          {adStatusFilters.map((item) => (
            <FilterLink key={item.key} href={`/admin/ads?position=${activePosition}&status=${item.key}`} active={activeStatus === item.key}>
              {item.label}
            </FilterLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-medium leading-none ${active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
    >
      {children}
    </a>
  );
}

function AdListItem({ ad, onEdit }: { ad: AdminAdRow; onEdit: () => void }) {
  const target = ad.open_mode === "internal" || ad.link_type === "internal" ? `/ads/${ad.slug ?? ""}` : ad.external_url || ad.link_url || "";
  const positionLabel = adPositions.find((item) => item.key === ad.position)?.label ?? ad.position;

  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {ad.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.image_url} alt="" className="h-14 w-20 flex-shrink-0 rounded-lg bg-slate-100 object-cover" />
      ) : (
        <div className="h-14 w-20 flex-shrink-0 rounded-lg bg-slate-100" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-slate-500">{target}</p>
        <p className="mt-1 text-xs">
          <span className="font-medium">位置:</span> {positionLabel}
          {" · "}
          <span className={`font-medium ${ad.open_mode === "internal" || ad.link_type === "internal" ? "text-purple-600" : "text-blue-600"}`}>
            {ad.open_mode === "internal" || ad.link_type === "internal" ? "内部页" : "外部链接"}
          </span>
          {" · "}
          <span className={ad.is_active ? "text-green-600" : "text-slate-400"}>{ad.is_active ? "启用" : "停用"}</span>
        </p>
        {(ad.start_date || ad.end_date) ? (
          <p className="mt-0.5 text-xs text-slate-400">
            {ad.start_date ? ad.start_date.slice(0, 10) : "—"} → {ad.end_date ? ad.end_date.slice(0, 10) : "—"}
          </p>
        ) : null}
      </div>
      <div className="flex flex-shrink-0 flex-col gap-1.5">
        <button type="button" onClick={onEdit} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium">
          编辑
        </button>
        <MiniAction action={toggleAdActive} label={ad.is_active ? "停用" : "启用"}>
          <input type="hidden" name="id" value={ad.id} />
          <input type="hidden" name="next_active" value={ad.is_active ? "false" : "true"} />
        </MiniAction>
        <MiniAction action={deleteAd} label="删除" danger>
          <input type="hidden" name="id" value={ad.id} />
        </MiniAction>
      </div>
    </li>
  );
}

function MiniAction({ action, label, children, danger = false }: { action: (state: AdminHomeActionState, formData: FormData) => Promise<AdminHomeActionState>; label: string; children: React.ReactNode; danger?: boolean }) {
  const [, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction}>
      {children}
      <button type="submit" disabled={pending} className={`w-full rounded-lg border px-3 py-1 text-xs font-medium disabled:opacity-50 ${danger ? "border-red-300 text-red-500" : "border-slate-200 text-slate-700"}`}>
        {pending ? "..." : label}
      </button>
    </form>
  );
}

function DateInput({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string | null }) {
  const initial = useMemo(() => toDateTimeLocal(defaultValue), [defaultValue]);
  const [value, setValue] = useState(initial);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex gap-2">
        <input name={name} type="datetime-local" value={value} onChange={(event) => setValue(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        {value ? (
          <button type="button" onClick={() => setValue("")} className="rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600">
            清除
          </button>
        ) : null}
      </div>
    </label>
  );
}

function Input({ label, name, defaultValue, placeholder, type = "text" }: { label: string; name: string; defaultValue?: string | null; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </label>
  );
}

function Textarea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string | null }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea name={name} rows={4} defaultValue={defaultValue ?? ""} placeholder="广告详细描述..." className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </label>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
