"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, uploadPostImage } from "@/features/posts/actions";
import { POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "@/features/posts/constants";
import type { HousingFields, JobFields, MarketplaceFields, PostFormErrors, PostFormValues, ServiceFields } from "@/features/posts/formTypes";
import { POST_IMAGE_CONFIG } from "@/features/posts/imageConfig";
import {
  EMPTY_LOCATION,
  HOUSING_MODE_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  JOB_MODE_OPTIONS,
  JOB_TYPE_OPTIONS,
  SECONDHAND_CATEGORY_OPTIONS,
  SECONDHAND_MODE_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
} from "@/features/posts/options";
import type { PostType } from "@/features/posts/types";
import { validatePostForm } from "@/features/posts/validators";
import { ContactFields } from "./ContactFields";
import { DraftRestoreBanner } from "./DraftRestoreBanner";
import { FormField } from "./FormField";
import { FormShell } from "./FormShell";
import { ImageUploader } from "./ImageUploader";
import { LocationSelect } from "./LocationSelect";
import { ProfileCompletionHint } from "./ProfileCompletionHint";
import { SelectInput } from "./SelectInput";
import { SubmitBar } from "./SubmitBar";
import { TextArea } from "./TextArea";
import { TextInput } from "./TextInput";

type PostFormProps = {
  mode: "create" | "edit";
  postType: PostType;
  initialValues: PostFormValues;
  showProfileCompletionHint?: boolean;
};

const draftVersion = 3;

function draftKey(postType: PostType) {
  return `openaa:post-form:${draftVersion}:${postType}:create`;
}

function titleFor(postType: PostType, mode: "create" | "edit") {
  return `${mode === "create" ? "发布" : "编辑"}${POST_TYPE_LABELS[postType]}`;
}

function descriptionFor(postType: PostType) {
  if (postType === "job") return "填写招聘或求职信息。信息内容和电话/微信是用户联系你的关键。";
  if (postType === "housing") return "发布房源、求租或求购信息。建议写清地区、价格、入住时间和要求。";
  if (postType === "marketplace") return "发布二手出售或求购信息。图片最多 3 张，第一张会作为封面。";
  return "发布本地服务信息。请写清服务内容、地区、价格说明和联系方式。";
}

function bodyPlaceholder(values: PostFormValues) {
  if (values.postType === "job") {
    return values.job?.job_mode === "seeking"
      ? "简单介绍技能、经历、求职意向等（可只写一段内容）"
      : "请写清楚：招聘岗位、要求、待遇、联系方式等（可只写一段内容）";
  }
  if (values.postType === "housing") {
    return values.housing?.housing_mode === "demand"
      ? "请描述：期望地区、预算、入住时间、人数、需求、联系方式等（可只写一段内容）"
      : "请描述：地址/区域、租金、房型、入住时间、要求、联系方式等（可只写一段内容）";
  }
  if (values.postType === "marketplace") {
    return values.marketplace?.marketplace_mode === "buying"
      ? "请描述需求、期望成色、交易方式等"
      : "请描述商品的品牌、型号、成色、交易方式等";
  }
  return "请详细描述您的服务内容、经验、上门范围等信息...";
}

function submitLabelFor(values: PostFormValues, mode: "create" | "edit") {
  if (mode === "edit") return "保存修改";
  if (values.postType === "marketplace") return values.marketplace?.marketplace_mode === "buying" ? "发布求购" : "发布商品";
  if (values.postType === "service") return "发布服务";
  return "发布";
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

function normalizeRestoredValues(values: PostFormValues, postType: PostType, mode: "create" | "edit") {
  return {
    ...values,
    postType,
    mode,
    location_area: values.location_area || EMPTY_LOCATION,
  };
}

export function PostForm({ mode, postType, initialValues, showProfileCompletionHint = false }: PostFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<PostFormValues>({ ...initialValues, mode, postType });
  const [errors, setErrors] = useState<PostFormErrors>({});
  const [message, setMessage] = useState<string>();
  const [hasDraft, setHasDraft] = useState(false);
  const [isPending, startTransition] = useTransition();
  const bottomMessageRef = useRef<HTMLDivElement | null>(null);
  const storageKey = useMemo(() => draftKey(postType), [postType]);
  const cancelHref = mode === "create" ? POST_TYPE_TO_ROUTE[postType] : values.postId ? `${POST_TYPE_TO_ROUTE[postType]}/${values.postId}` : "/profile/posts";
  const typeSwitchLocked = mode === "edit";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasDraft(mode === "create" && Boolean(window.localStorage.getItem(storageKey)));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [mode, storageKey]);

  useEffect(() => {
    if (message) {
      bottomMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [message]);

  const setValue = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const setJob = (patch: Partial<JobFields>) => setValues((current) => ({ ...current, job: { ...current.job!, ...patch } }));
  const setHousing = (patch: Partial<HousingFields>) => setValues((current) => ({ ...current, housing: { ...current.housing!, ...patch } }));
  const setMarketplace = (patch: Partial<MarketplaceFields>) => setValues((current) => ({ ...current, marketplace: { ...current.marketplace!, ...patch } }));
  const setService = (patch: Partial<ServiceFields>) => setValues((current) => ({ ...current, service: { ...current.service!, ...patch } }));

  function restoreDraft() {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      setValues(normalizeRestoredValues(JSON.parse(raw) as PostFormValues, postType, mode));
      setHasDraft(false);
    } catch {
      window.localStorage.removeItem(storageKey);
      setHasDraft(false);
    }
  }

  function clearDraft() {
    window.localStorage.removeItem(storageKey);
    setHasDraft(false);
  }

  function saveDraft() {
    window.localStorage.setItem(storageKey, JSON.stringify(withoutFiles(values)));
    router.back();
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
      setMessage(mode === "edit" ? "表单内容未填写完善，请检查后再保存。" : "表单内容未填写完善，请检查后再发布。");
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
    <FormShell title={titleFor(postType, mode)} description={descriptionFor(postType)}>
      <form className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6" onSubmit={onSubmit}>
        <DraftRestoreBanner visible={hasDraft} onRestore={restoreDraft} onClear={clearDraft} />

        {postType === "job" ? (
          <>
            <ModeSwitch
              label="发布类型"
              locked={typeSwitchLocked}
              options={JOB_MODE_OPTIONS}
              value={values.job?.job_mode ?? "hiring"}
              onChange={(next) => setJob({ job_mode: next as JobFields["job_mode"], company_name: next === "seeking" ? "" : values.job?.company_name ?? "" })}
            />

            <div className={values.job?.job_mode === "seeking" ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 gap-4 md:grid-cols-2"}>
              <FormField label="职位名称">
                <TextInput
                  value={values.title}
                  onChange={(event) => setValue("title", event.target.value)}
                  placeholder={values.job?.job_mode === "seeking" ? "不填默认：求职信息" : "不填默认：招聘信息"}
                  maxLength={80}
                />
              </FormField>
              {values.job?.job_mode === "hiring" ? (
                <FormField label="公司名称">
                  <TextInput value={values.job?.company_name} onChange={(event) => setJob({ company_name: event.target.value })} placeholder="不填则不显示公司名称" />
                </FormField>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="工作类型" required error={errors.job_type}>
                <SelectInput value={values.job?.job_type ?? ""} onChange={(event) => setJob({ job_type: event.target.value })} required>
                  <option value="" disabled>
                    请选择工作类型
                  </option>
                  {JOB_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="职位分类" required error={errors.job_category}>
                <SelectInput value={values.job?.job_category} onChange={(event) => setJob({ job_category: event.target.value })} required>
                  <option value="" disabled>
                    请选择职位分类
                  </option>
                  {JOB_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </SelectInput>
              </FormField>
            </div>

            <FormField label="工作地点" required error={errors.work_area}>
              <LocationSelect
                value={values.job?.work_area || values.location_area}
                onChange={(next) => {
                  setJob({ work_area: next });
                  setValue("location_area", next);
                }}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="薪资（USD）">
                <TextInput value={values.job?.salary_min} onChange={(event) => setJob({ salary_min: event.target.value, salary_max: event.target.value })} type="number" min="0" placeholder="不填则显示：薪资电议" />
              </FormField>
              <FormField label="薪资单位">
                <SelectInput value={values.job?.salary_unit} onChange={(event) => setJob({ salary_unit: event.target.value })}>
                  <option value="hour">小时</option>
                  <option value="day">天薪</option>
                  <option value="week">周薪</option>
                  <option value="month">月薪</option>
                  <option value="year">年薪</option>
                </SelectInput>
              </FormField>
            </div>

            {values.job?.job_mode === "seeking" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField label="工作经验">
                  <TextInput value={values.job?.experience_requirement} onChange={(event) => setJob({ experience_requirement: event.target.value })} placeholder="例：3年 / 应届（可不填）" />
                </FormField>
                <FormField label="可工作时间">
                  <TextInput value={values.job?.language_requirement} onChange={(event) => setJob({ language_requirement: event.target.value })} placeholder="例：随时 / 两周后（可不填）" />
                </FormField>
              </div>
            ) : null}
          </>
        ) : null}

        {postType === "housing" ? (
          <>
            <ModeSwitch
              label="发布类型"
              locked={typeSwitchLocked}
              options={HOUSING_MODE_OPTIONS}
              value={values.housing?.housing_mode ?? "supply"}
              onChange={(next) => setHousing({ housing_mode: next as HousingFields["housing_mode"] })}
            />

            <FormField label="标题">
              <TextInput
                value={values.title}
                onChange={(event) => setValue("title", event.target.value)}
                placeholder={values.housing?.housing_mode === "demand" ? "不填默认：求租" : "不填默认：房屋出租"}
                maxLength={80}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="地区" required error={errors.location_area}>
                <LocationSelect value={values.location_area} onChange={(next) => setValue("location_area", next)} />
              </FormField>
              <FormField label="租金（USD）">
                <TextInput value={values.housing?.price} onChange={(event) => setHousing({ price: event.target.value })} type="number" min="0" placeholder="不填则不显示" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="房型" error={errors.room_type}>
                <TextInput value={values.housing?.room_type} onChange={(event) => setHousing({ room_type: event.target.value })} placeholder="例：一室一厅 / 主卧 / 次卧（可不填）" />
              </FormField>
              <FormField label="入住日期">
                <div className="flex gap-2">
                  <TextInput value={values.housing?.available_from} onChange={(event) => setHousing({ available_from: event.target.value })} type="date" />
                  <button
                    type="button"
                    onClick={() => setHousing({ available_from: "" })}
                    className="min-h-11 rounded-lg bg-white px-3 text-sm font-medium text-gray-600 ring-1 ring-gray-300 transition hover:bg-gray-50"
                  >
                    清空
                  </button>
                </div>
              </FormField>
            </div>
          </>
        ) : null}

        {postType === "marketplace" ? (
          <>
            <ModeSwitch
              label="发布类型"
              locked={typeSwitchLocked}
              options={SECONDHAND_MODE_OPTIONS}
              value={values.marketplace?.marketplace_mode ?? "selling"}
              onChange={(next) => setMarketplace({ marketplace_mode: next as MarketplaceFields["marketplace_mode"] })}
            />

            <FormField label="所在地区" required error={errors.trade_area}>
              <LocationSelect
                value={values.marketplace?.trade_area || values.location_area}
                onChange={(next) => {
                  setMarketplace({ trade_area: next });
                  setValue("location_area", next);
                }}
              />
            </FormField>

            <FormField label="商品分类" required error={errors.category}>
              <SelectInput value={values.marketplace?.category} onChange={(event) => setMarketplace({ category: event.target.value })} required>
                <option value="" disabled>
                  请选择商品分类
                </option>
                {SECONDHAND_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </SelectInput>
            </FormField>

            {values.marketplace?.marketplace_mode === "selling" ? (
              <>
                <FormField label="商品标题" required error={errors.title}>
                  <TextInput value={values.title} onChange={(event) => setValue("title", event.target.value)} placeholder="例：iPad Pro 11 寸" maxLength={80} />
                </FormField>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="价格（USD）">
                    <TextInput value={values.marketplace?.price} onChange={(event) => setMarketplace({ price: event.target.value })} type="number" min="0" step="0.01" placeholder="0.00" />
                  </FormField>
                  <FormField label="成色">
                    <TextInput value={values.marketplace?.condition} onChange={(event) => setMarketplace({ condition: event.target.value })} placeholder="例：九成新 / 全新未拆" />
                  </FormField>
                </div>
              </>
            ) : (
              <>
                <FormField label="求购物品">
                  <TextInput value={values.title} onChange={(event) => setValue("title", event.target.value)} placeholder="例：二手自行车" maxLength={80} />
                </FormField>
                <FormField label="预算范围">
                  <TextInput value={values.marketplace?.price} onChange={(event) => setMarketplace({ price: event.target.value })} placeholder="例：$100 - $200" />
                </FormField>
              </>
            )}
          </>
        ) : null}

        {postType === "service" ? (
          <>
            <FormField label="服务标题" required error={errors.title}>
              <TextInput value={values.title} onChange={(event) => setValue("title", event.target.value)} placeholder="例：专业水电维修，上门服务" maxLength={80} />
            </FormField>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="服务分类" required error={errors.service_category}>
                <SelectInput value={values.service?.service_category ?? ""} onChange={(event) => setService({ service_category: event.target.value })} required>
                  <option value="" disabled>
                    请选择你的服务分类
                  </option>
                  {SERVICE_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="服务地区" required error={errors.service_area}>
                <LocationSelect
                  value={values.service?.service_area || values.location_area}
                  onChange={(next) => {
                    setService({ service_area: next });
                    setValue("location_area", next);
                  }}
                />
              </FormField>
            </div>
          </>
        ) : null}

        <FormField
          label={postType === "job" ? (values.job?.job_mode === "seeking" ? "信息内容 / 个人简介" : "信息内容 / 职位描述") : postType === "service" ? "服务介绍" : "信息内容"}
          required
          error={errors.body}
        >
          <TextArea value={values.body} onChange={(event) => setValue("body", event.target.value)} rows={postType === "job" || postType === "housing" ? 7 : 5} placeholder={bodyPlaceholder(values)} />
        </FormField>

        {postType === "service" ? (
          <FormField label="价格说明（可选）">
            <TextInput value={values.service?.price_note} onChange={(event) => setService({ price_note: event.target.value, price_range: event.target.value })} placeholder="例：电话咨询 / 时薪 $30 起 / 按项目报价" />
          </FormField>
        ) : null}

        {postType !== "job" ? (
          <ImageUploader images={values.images} onChange={(images) => setValue("images", images)} disabled={isPending} maxImages={POST_IMAGE_CONFIG.maxImages} error={errors.images} />
        ) : null}

        {showProfileCompletionHint ? (
          <ProfileCompletionHint message="完善个人资料后，下次发布内容可自动填写联系方式和地区。" href="/profile/edit" linkLabel="去完善资料" />
        ) : null}

        <ContactFields value={values.contact} errors={errors} onChange={(contact) => setValue("contact", contact)} />

        <div ref={bottomMessageRef}>
          <SubmitBar
            cancelHref={cancelHref}
            submitting={isPending}
            mode={mode}
            error={message}
            submitLabel={submitLabelFor(values, mode)}
            onSaveDraft={mode === "create" ? saveDraft : undefined}
          />
        </div>
      </form>
    </FormShell>
  );
}

function ModeSwitch({
  label,
  value,
  options,
  locked,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  locked?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="inline-flex rounded-xl bg-gray-100 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (!locked) onChange(option.value);
            }}
            disabled={locked}
            className={
              value === option.value
                ? "rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm disabled:opacity-50"
                : "rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900 disabled:opacity-50"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
      {locked ? <p className="mt-2 text-xs text-gray-400">编辑模式下不支持切换类型。</p> : null}
    </div>
  );
}
