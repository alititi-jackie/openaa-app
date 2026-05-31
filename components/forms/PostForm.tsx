"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, uploadPostImage } from "@/features/posts/actions";
import { POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { HousingFields, JobFields, MarketplaceFields, PostFormErrors, PostFormValues, ServiceFields } from "@/features/posts/formTypes";
import type { PostType } from "@/features/posts/types";
import { validatePostForm } from "@/features/posts/validators";
import { ContactFields } from "./ContactFields";
import { DraftRestoreBanner } from "./DraftRestoreBanner";
import { FormField } from "./FormField";
import { FormShell } from "./FormShell";
import { ImageUploader } from "./ImageUploader";
import { SelectInput } from "./SelectInput";
import { SubmitBar } from "./SubmitBar";
import { TextArea } from "./TextArea";
import { TextInput } from "./TextInput";

type PostFormProps = {
  mode: "create" | "edit";
  postType: PostType;
  initialValues: PostFormValues;
};

const draftVersion = 1;

function draftKey(postType: PostType, mode: "create" | "edit", postId?: string) {
  return `openaa:post-form:${draftVersion}:${postType}:${mode}:${postId ?? "new"}`;
}

function titleFor(postType: PostType, mode: "create" | "edit") {
  return `${mode === "create" ? "发布" : "编辑"}${POST_TYPE_LABELS[postType]}`;
}

function withoutFiles(values: PostFormValues) {
  return {
    ...values,
    images: values.images
      .filter((image) => image.imageAssetId)
      .map((image) => ({
        imageAssetId: image.imageAssetId,
        url: image.url,
        path: image.path,
        caption: image.caption,
        width: image.width,
        height: image.height,
        sizeBytes: image.sizeBytes,
        mimeType: image.mimeType,
      })),
  };
}

export function PostForm({ mode, postType, initialValues }: PostFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<PostFormValues>({ ...initialValues, mode, postType });
  const [errors, setErrors] = useState<PostFormErrors>({});
  const [message, setMessage] = useState<string>();
  const [hasDraft, setHasDraft] = useState(false);
  const [draftPaused, setDraftPaused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const storageKey = useMemo(() => draftKey(postType, mode, initialValues.postId), [postType, mode, initialValues.postId]);
  const cancelHref = mode === "create" ? POST_TYPE_TO_ROUTE[postType] : values.postId ? `${POST_TYPE_TO_ROUTE[postType]}/${values.postId}` : "/profile/posts";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = Boolean(window.localStorage.getItem(storageKey));
      setHasDraft(stored);
      setDraftPaused(stored);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    if (draftPaused) return;

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(withoutFiles(values)));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [draftPaused, storageKey, values]);

  const setValue = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const setJob = (patch: Partial<JobFields>) => setValues((current) => ({ ...current, job: { ...current.job!, ...patch } }));
  const setHousing = (patch: Partial<HousingFields>) => setValues((current) => ({ ...current, housing: { ...current.housing!, ...patch } }));
  const setMarketplace = (patch: Partial<MarketplaceFields>) => setValues((current) => ({ ...current, marketplace: { ...current.marketplace!, ...patch } }));
  const setService = (patch: Partial<ServiceFields>) => setValues((current) => ({ ...current, service: { ...current.service!, ...patch } }));

  function restoreDraft() {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      setValues(JSON.parse(raw) as PostFormValues);
      setHasDraft(false);
      setDraftPaused(false);
    } catch {
      window.localStorage.removeItem(storageKey);
      setHasDraft(false);
      setDraftPaused(false);
    }
  }

  function clearDraft() {
    window.localStorage.removeItem(storageKey);
    setHasDraft(false);
    setDraftPaused(false);
  }

  async function uploadPendingImages(postId: string) {
    if (postType === "job") return;
    for (const [index, image] of values.images.entries()) {
      if (!image.file) continue;
      const result = await uploadPostImage(postId, postType, image.file, index);
      if (!result.ok) {
        throw new Error(result.message);
      }
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);
    const validation = validatePostForm(values);
    setErrors(validation.errors);
    if (!validation.valid) {
      setMessage("请检查表单内容。");
      return;
    }

    startTransition(async () => {
      const submitValues = withoutFiles(values) as PostFormValues;
      const result = mode === "create" ? await createPost(submitValues) : await updatePost(values.postId ?? "", submitValues);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage(result.message);
        return;
      }

      try {
        await uploadPendingImages(result.postId);
      } catch (error) {
        setMessage(error instanceof Error ? `内容已保存，但图片上传失败：${error.message}` : "内容已保存，但图片上传失败。");
        return;
      }

      window.localStorage.removeItem(storageKey);
      router.push(result.href);
    });
  }

  return (
    <FormShell title={titleFor(postType, mode)} description="填写基础信息和联系方式。本阶段支持发布、编辑和图片上传基础能力。">
      <form className="space-y-4" onSubmit={onSubmit}>
        <DraftRestoreBanner visible={hasDraft} onRestore={restoreDraft} onClear={clearDraft} />

        <FormField label="标题" required error={errors.title}>
          <TextInput value={values.title} onChange={(event) => setValue("title", event.target.value)} placeholder="请写清楚主题" maxLength={80} />
        </FormField>

        <FormField label="摘要">
          <TextInput value={values.summary} onChange={(event) => setValue("summary", event.target.value)} placeholder="一句话补充说明" maxLength={140} />
        </FormField>

        <FormField label="正文" required error={errors.body}>
          <TextArea value={values.body} onChange={(event) => setValue("body", event.target.value)} placeholder="请填写详细说明" />
        </FormField>

        <FormField label="区域">
          <TextInput value={values.location_area} onChange={(event) => setValue("location_area", event.target.value)} placeholder="例如 Flushing / Brooklyn" />
        </FormField>

        {postType === "job" ? (
          <div className="grid grid-cols-1 gap-3">
            <FormField label="招聘/求职">
              <SelectInput value={values.job?.job_mode} onChange={(event) => setJob({ job_mode: event.target.value as JobFields["job_mode"] })}>
                <option value="hiring">招聘</option>
                <option value="seeking">求职</option>
              </SelectInput>
            </FormField>
            <FormField label="公司/名称">
              <TextInput value={values.job?.company_name} onChange={(event) => setJob({ company_name: event.target.value })} />
            </FormField>
            <FormField label="工作类别">
              <TextInput value={values.job?.job_category} onChange={(event) => setJob({ job_category: event.target.value })} />
            </FormField>
            <FormField label="职位类型">
              <TextInput value={values.job?.job_type} onChange={(event) => setJob({ job_type: event.target.value })} placeholder="全职 / 兼职" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="最低薪资">
                <TextInput value={values.job?.salary_min} onChange={(event) => setJob({ salary_min: event.target.value })} inputMode="decimal" />
              </FormField>
              <FormField label="最高薪资">
                <TextInput value={values.job?.salary_max} onChange={(event) => setJob({ salary_max: event.target.value })} inputMode="decimal" />
              </FormField>
            </div>
            <FormField label="薪资单位">
              <SelectInput value={values.job?.salary_unit} onChange={(event) => setJob({ salary_unit: event.target.value })}>
                <option value="hour">小时</option>
                <option value="day">天</option>
                <option value="week">周</option>
                <option value="month">月</option>
              </SelectInput>
            </FormField>
            <FormField label="工作区域">
              <TextInput value={values.job?.work_area} onChange={(event) => setJob({ work_area: event.target.value })} />
            </FormField>
            <FormField label="经验要求">
              <TextInput value={values.job?.experience_requirement} onChange={(event) => setJob({ experience_requirement: event.target.value })} />
            </FormField>
            <FormField label="语言要求">
              <TextInput value={values.job?.language_requirement} onChange={(event) => setJob({ language_requirement: event.target.value })} />
            </FormField>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={values.job?.includes_meals} onChange={(event) => setJob({ includes_meals: event.target.checked })} />
              包餐
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={values.job?.includes_housing} onChange={(event) => setJob({ includes_housing: event.target.checked })} />
              包住
            </label>
          </div>
        ) : null}

        {postType === "housing" ? (
          <div className="grid grid-cols-1 gap-3">
            <FormField label="房屋类型">
              <SelectInput value={values.housing?.housing_mode} onChange={(event) => setHousing({ housing_mode: event.target.value as HousingFields["housing_mode"] })}>
                <option value="renting">出租</option>
                <option value="seeking">求租</option>
                <option value="selling">出售</option>
                <option value="buying">求购</option>
              </SelectInput>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="价格">
                <TextInput value={values.housing?.price} onChange={(event) => setHousing({ price: event.target.value })} inputMode="decimal" />
              </FormField>
              <FormField label="押金">
                <TextInput value={values.housing?.deposit} onChange={(event) => setHousing({ deposit: event.target.value })} inputMode="decimal" />
              </FormField>
            </div>
            <FormField label="房型">
              <TextInput value={values.housing?.room_type} onChange={(event) => setHousing({ room_type: event.target.value })} />
            </FormField>
            <FormField label="租期">
              <TextInput value={values.housing?.lease_type} onChange={(event) => setHousing({ lease_type: event.target.value })} />
            </FormField>
            <FormField label="入住日期">
              <TextInput value={values.housing?.available_from} onChange={(event) => setHousing({ available_from: event.target.value })} type="date" />
            </FormField>
            <FormField label="附近交通">
              <TextInput value={values.housing?.transit_nearby} onChange={(event) => setHousing({ transit_nearby: event.target.value })} />
            </FormField>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={values.housing?.allow_pets} onChange={(event) => setHousing({ allow_pets: event.target.checked })} />
              可宠物
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={values.housing?.utilities_included} onChange={(event) => setHousing({ utilities_included: event.target.checked })} />
              包水电
            </label>
          </div>
        ) : null}

        {postType === "marketplace" ? (
          <div className="grid grid-cols-1 gap-3">
            <FormField label="出售/求购">
              <SelectInput value={values.marketplace?.marketplace_mode} onChange={(event) => setMarketplace({ marketplace_mode: event.target.value as MarketplaceFields["marketplace_mode"] })}>
                <option value="selling">出售</option>
                <option value="buying">求购</option>
              </SelectInput>
            </FormField>
            <FormField label="类别">
              <TextInput value={values.marketplace?.category} onChange={(event) => setMarketplace({ category: event.target.value })} />
            </FormField>
            <FormField label="成色">
              <TextInput value={values.marketplace?.condition} onChange={(event) => setMarketplace({ condition: event.target.value })} />
            </FormField>
            <FormField label="价格">
              <TextInput value={values.marketplace?.price} onChange={(event) => setMarketplace({ price: event.target.value })} inputMode="decimal" />
            </FormField>
            <FormField label="交易区域">
              <TextInput value={values.marketplace?.trade_area} onChange={(event) => setMarketplace({ trade_area: event.target.value })} />
            </FormField>
            <FormField label="交付方式">
              <TextInput value={values.marketplace?.delivery_method} onChange={(event) => setMarketplace({ delivery_method: event.target.value })} placeholder="自取 / 面交 / 可配送" />
            </FormField>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={values.marketplace?.negotiable} onChange={(event) => setMarketplace({ negotiable: event.target.checked })} />
              可议价
            </label>
          </div>
        ) : null}

        {postType === "service" ? (
          <div className="grid grid-cols-1 gap-3">
            <FormField label="服务类别" required error={errors.service_category}>
              <TextInput value={values.service?.service_category} onChange={(event) => setService({ service_category: event.target.value })} />
            </FormField>
            <FormField label="服务区域">
              <TextInput value={values.service?.service_area} onChange={(event) => setService({ service_area: event.target.value })} />
            </FormField>
            <FormField label="营业时间">
              <TextInput value={values.service?.business_hours_text} onChange={(event) => setService({ business_hours_text: event.target.value })} />
            </FormField>
            <FormField label="价格范围">
              <TextInput value={values.service?.price_range} onChange={(event) => setService({ price_range: event.target.value })} />
            </FormField>
            <FormField label="价格说明">
              <TextInput value={values.service?.price_note} onChange={(event) => setService({ price_note: event.target.value })} />
            </FormField>
          </div>
        ) : null}

        {postType !== "job" ? <ImageUploader images={values.images} onChange={(images) => setValue("images", images)} disabled={isPending} /> : null}

        <ContactFields value={values.contact} errors={errors} onChange={(contact) => setValue("contact", contact)} />

        <SubmitBar cancelHref={cancelHref} submitting={isPending} mode={mode} error={message} />
      </form>
    </FormShell>
  );
}
