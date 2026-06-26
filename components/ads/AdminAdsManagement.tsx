"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { deleteAd, toggleAdActive, updateAdPlaceholderImage, upsertAd } from "@/features/ads/adminActions";
import {
  adPositions,
  adStatusFilters,
  type AdminAdRow,
  type AdminAdPlaceholder,
  type AdOpenMode,
  type AdPosition,
  type AdStatusFilter,
} from "@/features/ads/types";
import type { AdminHomeActionState } from "@/features/admin-home/types";

const initialState: AdminHomeActionState = { ok: true, message: "" };
type ImageSourceLock = "uploaded" | "external";

type AdminAdsManagementProps = {
  ads: AdminAdRow[];
  activePosition: AdPosition;
  activeStatus: AdStatusFilter;
  placeholder: AdminAdPlaceholder;
};

export function AdminAdsManagement({
  ads,
  activePosition,
  activeStatus,
  placeholder,
}: AdminAdsManagementProps) {
  const [editingAd, setEditingAd] = useState<AdminAdRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [openMode, setOpenMode] = useState<AdOpenMode>("internal");
  const [imageUrl, setImageUrl] = useState("");
  const [currentImageAssetId, setCurrentImageAssetId] = useState<string | null>(null);
  const [imageSourceLock, setImageSourceLock] = useState<ImageSourceLock | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [state, formAction, pending] = useActionState(upsertAd, initialState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const trimmedImageUrl = imageUrl.trim();
  const hasImage = Boolean(filePreviewUrl || trimmedImageUrl);
  const previewUrl = filePreviewUrl || trimmedImageUrl;
  const uploadDisabled = imageSourceLock === "external";
  const urlDisabled = imageSourceLock === "uploaded";

  useEffect(() => {
    if (state.ok && state.message) {
      resetForm(true);
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  function scrollToForm() {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function resetForm(close = false) {
    setEditingAd(null);
    setOpenMode("internal");
    setImageUrl("");
    setCurrentImageAssetId(null);
    setImageSourceLock(null);
    setFilePreviewUrl("");
    setUploadMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (close) {
      setIsFormOpen(false);
    }
  }

  function startCreate() {
    resetForm(false);
    setIsFormOpen(true);
    scrollToForm();
  }

  function startEdit(ad: AdminAdRow) {
    setIsFormOpen(true);
    setEditingAd(ad);
    setOpenMode(ad.open_mode);
    setImageUrl(ad.image_url ?? "");
    setCurrentImageAssetId(ad.image_asset_id ?? null);
    setImageSourceLock(ad.image_source_type === "storage" ? "uploaded" : ad.image_url ? "external" : null);
    setFilePreviewUrl("");
    setUploadMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    scrollToForm();
  }

  function clearImage() {
    setImageUrl("");
    setCurrentImageAssetId(null);
    setImageSourceLock(null);
    setUploadMessage("");
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFilePreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (imageSourceLock === "external") {
      event.target.value = "";
      setUploadMessage("请先删除外部图片链接，再上传图片");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.target.value = "";
      setUploadMessage("图片格式仅支持 JPG、PNG、WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setUploadMessage("图片大小不能超过 5MB");
      return;
    }
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFilePreviewUrl(URL.createObjectURL(file));
    setImageUrl("");
    setCurrentImageAssetId(null);
    setImageSourceLock("uploaded");
    setUploadMessage("已选择上传图片");
  }

  function handleImageUrlBlur() {
    const value = imageUrl.trim();
    if (!value) {
      if (imageSourceLock === "external") {
        setImageSourceLock(null);
      }
      setUploadMessage("");
      return;
    }
    if (!isHttpsUrl(value)) {
      setUploadMessage("图片链接必须以 https:// 开头");
      return;
    }
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFilePreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (value !== editingAd?.image_url) {
      setCurrentImageAssetId(null);
    }
    setImageUrl(value);
    setImageSourceLock("external");
    setUploadMessage("");
  }

  const filteredAds = useMemo(() => ads, [ads]);

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">广告管理</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              按位置管理广告图、详情页、外部链接、启用状态与排序。
            </p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            新增广告
          </button>
        </div>
      </div>

      <AdPlaceholderSettings placeholder={placeholder} />

      <AdsFilter activePosition={activePosition} activeStatus={activeStatus} />

      {isFormOpen ? (
        <form
          ref={formRef}
          action={formAction}
          encType="multipart/form-data"
          className="space-y-5 rounded-[28px] border border-blue-100 bg-white p-4 shadow-sm sm:p-5"
        >
          <input type="hidden" name="id" value={editingAd?.id ?? ""} />
          <input type="hidden" name="image_asset_id" value={currentImageAssetId ?? ""} />
          <input type="hidden" name="sort_order" value={editingAd?.sort_order ?? 0} />

          <div className="flex flex-col gap-1">
            <h3 className="text-base font-black text-slate-950">
              {editingAd ? "编辑广告" : "新增广告"}
            </h3>
            <p className="text-sm font-semibold text-slate-500">
              广告位置、图片和打开方式为必填。外部图片链接仅支持 https。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-black text-slate-700">
              广告位置 *
              <select
                name="position"
                required
                defaultValue={editingAd?.position ?? activePosition}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="">请选择广告所在类别</option>
                {adPositions.map((position) => (
                  <option key={position.key} value={position.key}>
                    {position.label.replace("广告", "")} ({position.key})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-black text-slate-700">
              打开方式 *
              <select
                name="open_mode"
                required
                value={openMode}
                onChange={(event) => setOpenMode(event.target.value as AdOpenMode)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="internal">内部详情页</option>
                <option value="external_new">外部链接 - 新窗口</option>
                <option value="external_same">外部链接 - 当前窗口</option>
              </select>
            </label>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-black text-slate-700">
                上传广告图
                <input
                  ref={fileInputRef}
                  name="image_file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploadDisabled}
                  onChange={handleFileChange}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-black file:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2 text-sm font-black text-slate-700">
                或使用外部图片链接
                <input
                  name="image_url"
                  value={imageUrl}
                  disabled={urlDisabled}
                  onChange={(event) => setImageUrl(event.target.value)}
                  onBlur={handleImageUrlBlur}
                  placeholder="外部图片 URL，例如 https://img.openaa.com/banners/xxx.jpg"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-500">
                图片只能二选一。要更换图片，请先删除当前图片。
              </p>
              {hasImage ? (
                <button
                  type="button"
                  onClick={clearImage}
                  className="h-10 rounded-2xl border border-red-200 bg-white px-4 text-sm font-black text-red-600 transition hover:bg-red-50"
                >
                  删除图片
                </button>
              ) : null}
            </div>

            {uploadMessage ? (
              <p className="text-sm font-black text-blue-700">{uploadMessage}</p>
            ) : null}

            {previewUrl ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="广告预览" className="h-40 w-full object-cover" />
              </div>
            ) : null}
          </div>

          {openMode === "internal" ? <InternalFields ad={editingAd} /> : <ExternalFields ad={editingAd} />}

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
              <input
                name="is_active"
                type="checkbox"
                value="true"
                defaultChecked={editingAd?.is_active ?? true}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              立即启用
            </label>
            <DateInput key={`start-${editingAd?.id ?? "new"}-${editingAd?.start_date ?? ""}`} label="开始日期（可选）" name="start_date" value={editingAd?.start_date ?? null} />
            <DateInput key={`end-${editingAd?.id ?? "new"}-${editingAd?.end_date ?? ""}`} label="结束日期（可选）" name="end_date" value={editingAd?.end_date ?? null} endDate />
          </div>

          {state.message ? (
            <p className={`rounded-2xl px-4 py-3 text-sm font-black ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {state.message}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => resetForm(true)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-12 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "处理中..." : editingAd ? "保存修改" : "提交广告"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-black text-slate-950">现有广告</h3>
          <span className="text-sm font-black text-slate-500">{filteredAds.length} 条</span>
        </div>
        {filteredAds.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-black text-slate-500">
            暂无符合条件的广告
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAds.map((ad) => (
              <AdListItem key={ad.id} ad={ad} onEdit={() => startEdit(ad)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function InternalFields({ ad }: { ad: AdminAdRow | null }) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-black text-slate-700">
          页面标识 (slug) *
          <input
            name="slug"
            defaultValue={ad?.slug ?? ""}
            placeholder="例如 home-top-banner"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
          />
          <span className="block text-xs font-semibold text-slate-500">
            只能使用小写字母、数字和短横线，访问路径将为 /ads/你的标识
          </span>
        </label>
        <label className="space-y-2 text-sm font-black text-slate-700">
          标题 *
          <input
            name="title"
            defaultValue={ad?.title ?? ""}
            required
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
          />
        </label>
      </div>
      <label className="space-y-2 text-sm font-black text-slate-700">
        详情内容（可选）
        <textarea
          name="content"
          defaultValue={ad?.content ?? ""}
          rows={5}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-black text-slate-700">
          联系人（可选）
          <input name="contact_name" defaultValue={ad?.contact_name ?? ""} className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
        </label>
        <label className="space-y-2 text-sm font-black text-slate-700">
          联系电话（可选）
          <input name="phone" defaultValue={ad?.phone ?? ""} className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
        </label>
        <label className="space-y-2 text-sm font-black text-slate-700">
          微信号（可选）
          <input name="wechat" defaultValue={ad?.wechat ?? ""} className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
        </label>
        <label className="space-y-2 text-sm font-black text-slate-700">
          地址（可选）
          <input name="address" defaultValue={ad?.address ?? ""} className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
        </label>
      </div>
    </div>
  );
}

function ExternalFields({ ad }: { ad: AdminAdRow | null }) {
  return (
    <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <label className="space-y-2 text-sm font-black text-slate-700">
        标题 *
        <input
          name="title"
          defaultValue={ad?.title ?? ""}
          required
          className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
        />
      </label>
      <label className="space-y-2 text-sm font-black text-slate-700">
        外部链接地址 *
        <input
          name="external_url"
          defaultValue={ad?.external_url ?? ""}
          placeholder="example.com 或 https://example.com"
          required
          className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
        />
        <span className="hidden">
          必须以 http:// 或 https:// 开头。
        </span>
      </label>
      <p className="md:col-start-2 text-xs font-semibold text-slate-500">
        可填写 /jobs 这类站内链接；外部域名会自动补全为 https://。
      </p>
    </div>
  );
}

function AdsFilter({
  activePosition,
  activeStatus,
}: {
  activePosition: AdPosition;
  activeStatus: AdStatusFilter;
}) {
  return (
    <div className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {adPositions.map((position) => (
          <FilterLink
            key={position.key}
            href={`/admin/ads?position=${position.key}&status=${activeStatus}`}
            active={position.key === activePosition}
          >
            {position.label.replace("广告", "")}
          </FilterLink>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {adStatusFilters.map((filter) => (
          <FilterLink
            key={filter.key}
            href={`/admin/ads?position=${activePosition}&status=${filter.key}`}
            active={filter.key === activeStatus}
          >
            {filter.label}
          </FilterLink>
        ))}
      </div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border px-4 text-sm font-black transition ${
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
      }`}
    >
      {children}
    </a>
  );
}

function AdPlaceholderSettings({ placeholder }: { placeholder: AdminAdPlaceholder }) {
  const [state, formAction, pending] = useActionState(updateAdPlaceholderImage, initialState);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrl = filePreviewUrl || placeholder.imageUrl || "";

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  useEffect(() => {
    if (state.ok && state.message && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [state]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.target.value = "";
      setUploadMessage("图片格式仅支持 JPG、PNG、WEBP");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setUploadMessage("图片大小不能超过 5MB");
      return;
    }

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(URL.createObjectURL(file));
    setUploadMessage("已选择新的广告占位图");
  }

  return (
    <details className="group rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="text-base font-black text-slate-950">默认广告占位图</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{placeholder.imageUrl ? "已设置" : "未设置"}</p>
        </div>
        <span className="inline-flex min-h-9 shrink-0 items-center rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
          <span className="group-open:hidden">展开</span>
          <span className="hidden group-open:inline">收起</span>
        </span>
      </summary>

      <form action={formAction} encType="multipart/form-data" className="mt-4 space-y-4 border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-slate-500">
          当广告图片为空、外链失效或加载失败时，全站广告位会优先显示这里上传的占位图；未上传时显示内置广告位占位。
        </p>
        <div className="space-y-3">
          <label className="space-y-2 text-sm font-black text-slate-700">
            上传占位图
            <input
              ref={fileInputRef}
              name="placeholder_image_file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-black file:text-blue-700"
            />
          </label>
          <p className="text-xs font-semibold text-slate-500">仅支持本地上传图片，不支持外部图片 URL。建议上传与广告横幅一致比例的图片。</p>
          {uploadMessage ? <p className="text-sm font-black text-blue-700">{uploadMessage}</p> : null}
          {state.message ? (
            <p className={`rounded-2xl px-4 py-3 text-sm font-black ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {state.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "保存中..." : "保存占位图"}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="默认广告占位图预览" className="h-[160px] w-full bg-slate-100 object-cover sm:h-[180px] md:h-[200px]" />
          ) : (
            <div className="flex h-[160px] flex-col items-center justify-center gap-1 bg-slate-100 px-4 text-center text-slate-500 sm:h-[180px] md:h-[200px]">
              <span className="text-sm font-black text-slate-700">OpenAA 广告位</span>
              <span className="text-xs font-semibold">未上传默认占位图</span>
            </div>
          )}
        </div>
      </form>
    </details>
  );
}

function AdListItem({ ad, onEdit }: { ad: AdminAdRow; onEdit: () => void }) {
  const positionLabel = adPositions.find((position) => position.key === ad.position)?.label ?? ad.position;
  const target = ad.open_mode === "internal" ? `/ads/${ad.slug}` : ad.external_url;
  const actionState = useMemo<AdminHomeActionState>(() => ({ ok: true, message: "" }), []);
  const [, toggleAction, togglePending] = useActionState(toggleAdActive, actionState);
  const [, deleteAction, deletePending] = useActionState(deleteAd, actionState);

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {ad.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.image_url} alt={ad.title} className="h-28 w-full object-cover sm:h-full" />
          ) : (
            <div className="flex h-28 items-center justify-center text-xs font-black text-slate-400">无图片</div>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h4 className="truncate text-base font-black text-slate-950">{ad.title}</h4>
              <p className="truncate text-xs font-semibold text-slate-500">{target || "未设置目标"}</p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${ad.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
              {ad.is_active ? "启用" : "停用"}
            </span>
          </div>
          <div className="grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-3">
            <span>{positionLabel}</span>
            <span>{ad.open_mode === "internal" ? "内部页" : "外部链接"}</span>
            <span>
              {formatAdDate(ad.start_date) || "—"} 至 {formatAdDate(ad.end_date, true) || "—"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={onEdit}
              className="h-10 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-100"
            >
              编辑
            </button>
            <form action={toggleAction}>
              <input type="hidden" name="id" value={ad.id} />
              <input type="hidden" name="next_active" value={ad.is_active ? "false" : "true"} />
              <button
                type="submit"
                disabled={togglePending}
                className="h-10 w-full rounded-2xl border border-blue-200 bg-white text-sm font-black text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
              >
                {ad.is_active ? "停用" : "启用"}
              </button>
            </form>
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (!window.confirm(`确认删除广告“${ad.title}”吗？删除后前台将不再展示。`)) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={ad.id} />
              <button
                type="submit"
                disabled={deletePending}
                className="h-10 w-full rounded-2xl border border-red-200 bg-white text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                删除
              </button>
            </form>
          </div>
        </div>
      </div>
    </article>
  );
}

function DateInput({
  label,
  name,
  value,
  endDate = false,
}: {
  label: string;
  name: string;
  value: string | null;
  endDate?: boolean;
}) {
  const inputId = `${name}-${label}`;
  const [inputValue, setInputValue] = useState(toDateInputValue(value, endDate));

  return (
    <div className="space-y-2 text-sm font-black text-slate-700">
      <label htmlFor={inputId}>{label}</label>
      <div className="flex gap-2">
        <input
          id={inputId}
          name={name}
          type="date"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setInputValue("");
          }}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          清除
        </button>
      </div>
    </div>
  );
}

function formatAdDate(value: string | null, endDate = false) {
  return toDateInputValue(value, endDate);
}

function toDateInputValue(value: string | null, endDate = false) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const parts = datePartsInNewYork(date);
  if (endDate && parts.hour === 0 && parts.minute === 0 && parts.second === 0) {
    const previousDay = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    return datePartsInNewYork(previousDay).date;
  }
  return parts.date;
}

function datePartsInNewYork(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
