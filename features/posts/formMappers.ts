import { POST_TYPE_TO_ROUTE } from "./constants";
import type { PostFormValues } from "./formTypes";
import type { PostDetailView, PostType } from "./types";

export const LOCATION_OPTIONS = [
  "纽约 New York",
  "法拉盛 Flushing",
  "皇后区 Queens",
  "布鲁克林 Brooklyn",
  "曼哈顿 Manhattan",
  "布朗士 Bronx",
  "史登岛 Staten Island",
  "长岛 Long Island",
  "上州纽约 Upstate NY",
  "新泽西 New Jersey",
  "其它地区 Other",
] as const;

export const DEFAULT_LOCATION = "纽约 New York";

function fieldValue(post: PostDetailView, label: string) {
  return post.fields.find((field) => field.label === label)?.value ?? "";
}

export function emptyPostFormValues(postType: PostType): PostFormValues {
  return {
    postType,
    mode: "create",
    title: "",
    summary: "",
    body: "",
    location_area: DEFAULT_LOCATION,
    visibility: "public",
    contact: {
      contact_name: "",
      phone: "",
      wechat: "",
      email: "",
      preferred_contact_method: "phone",
    },
    images: [],
    job: {
      job_mode: "hiring",
      company_name: "",
      job_category: "其它职位",
      job_type: "其它",
      salary_min: "",
      salary_max: "",
      salary_unit: "hour",
      work_area: DEFAULT_LOCATION,
      experience_requirement: "",
      language_requirement: "",
      includes_meals: false,
      includes_housing: false,
      identity_requirement: "",
      employer_type: "",
    },
    housing: {
      housing_mode: "renting",
      price: "",
      price_unit: "month",
      deposit: "",
      room_type: "",
      lease_type: "",
      available_from: "",
      allow_pets: false,
      utilities_included: false,
      transit_nearby: "",
    },
    marketplace: {
      marketplace_mode: "selling",
      category: "生活用品",
      condition: "",
      price: "",
      negotiable: false,
      trade_area: DEFAULT_LOCATION,
      delivery_method: "",
    },
    service: {
      service_category: "其它服务",
      service_area: DEFAULT_LOCATION,
      business_hours_text: "",
      price_range: "",
      price_note: "",
      business_profile_user_id: "",
    },
  };
}

export function formValuesFromDetail(post: PostDetailView): PostFormValues {
  const values: PostFormValues = {
    ...emptyPostFormValues(post.type),
    mode: "edit" as const,
    postId: post.id,
    title: post.title,
    summary: post.description,
    body: post.body,
    location_area: post.location ?? DEFAULT_LOCATION,
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

  if (post.type === "job") {
    values.job = {
      ...values.job!,
      job_category: fieldValue(post, "类型") || values.job!.job_category,
      job_type: fieldValue(post, "类型") || values.job!.job_type,
      work_area: fieldValue(post, "区域") || values.location_area,
    };
  }

  if (post.type === "housing") {
    values.housing = {
      ...values.housing!,
      room_type: fieldValue(post, "房型"),
      price: fieldValue(post, "价格").replace(/[$,]/g, ""),
    };
  }

  if (post.type === "marketplace") {
    values.marketplace = {
      ...values.marketplace!,
      price: fieldValue(post, "价格").replace(/[$,]/g, ""),
      condition: fieldValue(post, "成色"),
      trade_area: fieldValue(post, "交易区域") || values.location_area,
    };
  }

  if (post.type === "service") {
    values.service = {
      ...values.service!,
      service_category: fieldValue(post, "服务") || values.service!.service_category,
      service_area: fieldValue(post, "区域") || values.location_area,
      price_range: fieldValue(post, "价格"),
    };
  }

  return values;
}

export function postHref(postType: PostType, id: string) {
  return `${POST_TYPE_TO_ROUTE[postType]}/${id}`;
}
