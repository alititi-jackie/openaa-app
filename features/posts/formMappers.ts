import { POST_TYPE_TO_ROUTE } from "./constants";
import {
  defaultHousingFields,
  defaultJobFields,
  defaultMarketplaceFields,
  defaultServiceFields,
  housingFieldsFromRecord,
  jobFieldsFromRecord,
  marketplaceFieldsFromRecord,
  serviceFieldsFromRecord,
  structuredFormLocation,
} from "./adapters";
import type { PostFormValues, PublishContactDefaults } from "./formTypes";
import {
  DEFAULT_LOCATION,
  EMPTY_LOCATION,
  JOB_CATEGORY_OPTIONS,
  JOB_MODE_OPTIONS,
  JOB_TYPE_OPTIONS,
  LOCATION_OPTIONS,
  SECONDHAND_CATEGORY_OPTIONS,
  SECONDHAND_MODE_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  normalizeHousingType,
  isOptionValue,
  type JobMode,
  type PostOption,
  type SecondhandMode,
} from "./options";
import type { PostDetailView, PostType } from "./types";

type ProfilePublishDefaultsSource = {
  email?: string | null;
  phone?: string | null;
  wechat_id?: string | null;
  location_area?: string | null;
  preferred_contact_method?: string | null;
  default_publish_contact_name?: string | null;
  publish_email_mode?: string | null;
  publish_email?: string | null;
};

function legacyFieldValue(post: PostDetailView, label: string) {
  return post.fields.find((field) => field.label === label)?.value ?? "";
}

function legacyMetaValue(post: PostDetailView, label: string) {
  return post.detailMetaFields.find((field) => field.label === label)?.value ?? "";
}

function defaultPreferredContactMethod(value?: string | null): "phone" | "wechat" | "email" {
  return value === "wechat" || value === "email" ? value : "phone";
}

function optionValueOrEmpty(options: readonly PostOption[], value?: string | null) {
  return isOptionValue(options, value) ? value ?? "" : "";
}

export function publishContactDefaultsFromProfile(profile?: ProfilePublishDefaultsSource | null): PublishContactDefaults {
  if (!profile) return {};

  const emailMode = profile.publish_email_mode ?? "hidden";
  const email = emailMode === "account" ? profile.email : emailMode === "custom" ? profile.publish_email : "";

  return {
    contact_name: profile.default_publish_contact_name ?? "",
    phone: profile.phone ?? "",
    wechat: profile.wechat_id ?? "",
    email: email ?? "",
    location_area: profile.location_area ?? "",
    preferred_contact_method: profile.preferred_contact_method ?? "phone",
  };
}

export function profileNeedsPublishDefaultsTip(profile?: ProfilePublishDefaultsSource | null) {
  return !(
    profile?.default_publish_contact_name?.trim() &&
    profile.phone?.trim() &&
    profile.wechat_id?.trim() &&
    profile.location_area?.trim()
  );
}

export function emptyPostFormValues(postType: PostType, contactDefaults: PublishContactDefaults = {}): PostFormValues {
  const defaultLocation = contactDefaults.location_area ?? EMPTY_LOCATION;

  return {
    postType,
    mode: "create",
    title: "",
    summary: "",
    body: "",
    location_area: defaultLocation,
    visibility: "public",
    contact: {
      contact_name: contactDefaults.contact_name ?? "",
      phone: contactDefaults.phone ?? "",
      wechat: contactDefaults.wechat ?? "",
      email: contactDefaults.email ?? "",
      preferred_contact_method: defaultPreferredContactMethod(contactDefaults.preferred_contact_method),
    },
    images: [],
    job: defaultJobFields(defaultLocation),
    housing: defaultHousingFields(),
    marketplace: defaultMarketplaceFields(defaultLocation),
    service: defaultServiceFields(defaultLocation),
  };
}

export function formValuesFromDetail(post: PostDetailView): PostFormValues {
  const structuredLocation = post.sourceRecord ? structuredFormLocation(post.sourceRecord) : "";
  const values: PostFormValues = {
    ...emptyPostFormValues(post.type),
    mode: "edit" as const,
    postId: post.id,
    title: post.title,
    summary: post.description,
    body: post.body,
    location_area: structuredLocation || post.area || post.location || DEFAULT_LOCATION,
    contact: {
      contact_name: post.contact?.contact_name ?? "",
      phone: post.contact?.phone ?? "",
      wechat: post.contact?.wechat ?? "",
      email: post.contact?.email ?? "",
      preferred_contact_method:
        post.contact?.preferred_contact_method === "wechat" || post.contact?.preferred_contact_method === "email" ? post.contact.preferred_contact_method : "phone",
    },
    images: post.images.map((image) => ({ imageAssetId: image.imageAssetId ?? undefined, url: image.url, caption: image.caption ?? "" })),
  };

  if (post.sourceRecord) {
    if (post.type === "job") {
      values.job = jobFieldsFromRecord(post.sourceRecord, values.job!);
      values.location_area = values.job.work_area || values.location_area;
    } else if (post.type === "housing") {
      values.housing = housingFieldsFromRecord(post.sourceRecord, values.housing!);
      values.location_area = structuredLocation || values.location_area;
    } else if (post.type === "marketplace") {
      values.marketplace = marketplaceFieldsFromRecord(post.sourceRecord, values.marketplace!);
      values.location_area = values.marketplace.trade_area || values.location_area;
    } else if (post.type === "service") {
      values.service = serviceFieldsFromRecord(post.sourceRecord, values.service!);
      values.location_area = values.service.service_area || values.location_area;
    }

    return values;
  }

  // Legacy fallback only: current detail mapping provides sourceRecord, so edit forms use structured fields above.
  const housingArea = optionValueOrEmpty(LOCATION_OPTIONS, legacyFieldValue(post, "区域")) || optionValueOrEmpty(LOCATION_OPTIONS, legacyMetaValue(post, "地区"));
  const marketplaceArea = optionValueOrEmpty(LOCATION_OPTIONS, legacyFieldValue(post, "交易区域")) || optionValueOrEmpty(LOCATION_OPTIONS, legacyMetaValue(post, "地区"));
  const serviceArea = optionValueOrEmpty(LOCATION_OPTIONS, legacyFieldValue(post, "区域")) || optionValueOrEmpty(LOCATION_OPTIONS, legacyMetaValue(post, "地区"));
  values.location_area = housingArea || marketplaceArea || serviceArea || optionValueOrEmpty(LOCATION_OPTIONS, post.location) || EMPTY_LOCATION;

  if (post.type === "job") {
    const category = optionValueOrEmpty(JOB_CATEGORY_OPTIONS, legacyFieldValue(post, "职位分类")) || optionValueOrEmpty(JOB_CATEGORY_OPTIONS, post.tag);
    const jobType = optionValueOrEmpty(JOB_TYPE_OPTIONS, legacyFieldValue(post, "类型"));

    values.job = {
      ...values.job!,
      job_mode: isOptionValue(JOB_MODE_OPTIONS, post.mode) ? (post.mode as JobMode) : values.job!.job_mode,
      job_category: category || values.job!.job_category,
      job_type: jobType || values.job!.job_type,
      work_area: optionValueOrEmpty(LOCATION_OPTIONS, legacyFieldValue(post, "区域")) || values.location_area,
    };
  }

  if (post.type === "housing") {
    values.housing = {
      ...values.housing!,
      housing_mode: normalizeHousingType(post.mode || values.housing!.housing_mode),
      room_type: legacyFieldValue(post, "房型"),
      price: legacyFieldValue(post, "价格").replace(/[$,]/g, ""),
    };
  }

  if (post.type === "marketplace") {
    values.marketplace = {
      ...values.marketplace!,
      marketplace_mode: isOptionValue(SECONDHAND_MODE_OPTIONS, post.mode) ? (post.mode as SecondhandMode) : values.marketplace!.marketplace_mode,
      category: optionValueOrEmpty(SECONDHAND_CATEGORY_OPTIONS, legacyMetaValue(post, "分类")) || optionValueOrEmpty(SECONDHAND_CATEGORY_OPTIONS, post.tag) || values.marketplace!.category,
      price: legacyFieldValue(post, "价格").replace(/[$,]/g, ""),
      condition: legacyFieldValue(post, "成色"),
      trade_area: marketplaceArea || values.location_area,
    };
  }

  if (post.type === "service") {
    values.service = {
      ...values.service!,
      service_category: optionValueOrEmpty(SERVICE_CATEGORY_OPTIONS, legacyMetaValue(post, "服务分类")) || optionValueOrEmpty(SERVICE_CATEGORY_OPTIONS, legacyFieldValue(post, "服务")) || values.service!.service_category,
      service_area: serviceArea || values.location_area,
      price_range: legacyFieldValue(post, "价格"),
      price_note: legacyFieldValue(post, "价格"),
    };
  }

  return values;
}

export function postHref(postType: PostType, id: string) {
  return `${POST_TYPE_TO_ROUTE[postType]}/${id}`;
}
