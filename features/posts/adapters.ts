import { getHousingDetail, getJobDetail, getMarketplaceDetail, getPostArea, getPostPriceDisplay, getServiceDetail } from "./accessors";
import { postChannelConfig } from "./channelConfig";
import { numericOrNull } from "./display";
import type { HousingFields, JobFields, MarketplaceFields, PostFormValues, ServiceFields } from "./formTypes";
import type { PostRecord, PostType } from "./types";

export function postCategoryForForm(values: PostFormValues) {
  if (values.postType === "job") return values.job?.job_category || null;
  if (values.postType === "housing") return values.housing?.room_type || null;
  if (values.postType === "marketplace") return values.marketplace?.category || null;
  return values.service?.service_category || null;
}

export function postModeForForm(values: PostFormValues) {
  if (values.postType === "job") return values.job?.job_mode || null;
  if (values.postType === "housing") return values.housing?.housing_mode || null;
  if (values.postType === "marketplace") return values.marketplace?.marketplace_mode || null;
  return null;
}

export function postPriceForForm(values: PostFormValues) {
  if (values.postType === "housing") return numericOrNull(values.housing?.price ?? "");
  if (values.postType === "marketplace") return numericOrNull(values.marketplace?.price ?? "");
  return null;
}

export function postTitleForForm(values: PostFormValues) {
  if (values.title.trim()) return values.title.trim();
  if (values.postType === "job") return values.job?.job_mode === "seeking" ? "求职信息" : "招聘信息";
  if (values.postType === "housing") return values.housing?.housing_mode === "demand" ? "求租" : "房屋出租";
  if (values.postType === "marketplace") return values.marketplace?.marketplace_mode === "buying" ? "求购" : "二手商品";
  return "本地服务";
}

export function defaultJobFields(location: string): JobFields {
  const config = postChannelConfig("job");
  return {
    job_mode: config.form.defaultMode as JobFields["job_mode"],
    company_name: "",
    job_category: "",
    job_type: "",
    salary_min: "",
    salary_max: "",
    salary_unit: config.form.defaultSalaryUnit ?? "hour",
    work_area: location,
    experience_requirement: "",
    language_requirement: "",
    includes_meals: false,
    includes_housing: false,
    identity_requirement: "",
    employer_type: "",
  };
}

export function defaultHousingFields(): HousingFields {
  const config = postChannelConfig("housing");
  return {
    housing_mode: config.form.defaultMode as HousingFields["housing_mode"],
    price: "",
    price_unit: config.form.defaultPriceUnit ?? "month",
    deposit: "",
    room_type: "",
    lease_type: "",
    available_from: "",
    allow_pets: false,
    utilities_included: false,
    transit_nearby: "",
  };
}

export function defaultMarketplaceFields(location: string): MarketplaceFields {
  const config = postChannelConfig("marketplace");
  return {
    marketplace_mode: config.form.defaultMode as MarketplaceFields["marketplace_mode"],
    category: "",
    condition: "",
    price: "",
    negotiable: false,
    trade_area: location,
    delivery_method: "",
  };
}

export function defaultServiceFields(location: string): ServiceFields {
  return {
    service_category: "",
    service_area: location,
    business_hours_text: "",
    price_range: "",
    price_note: "",
    business_profile_user_id: "",
  };
}

export function structuredFormLocation(record: PostRecord) {
  return getPostArea(record);
}

export function jobFieldsFromRecord(record: PostRecord, fallback: JobFields): JobFields {
  const detail = getJobDetail(record);
  return {
    ...fallback,
    job_mode: (record.subcategory || fallback.job_mode) as JobFields["job_mode"],
    company_name: detail?.employer_type ?? "",
    job_category: detail?.job_category ?? fallback.job_category,
    job_type: detail?.employment_type ?? fallback.job_type,
    salary_min: detail?.wage_min === null || detail?.wage_min === undefined ? "" : String(detail.wage_min),
    salary_max: detail?.wage_max === null || detail?.wage_max === undefined ? "" : String(detail.wage_max),
    salary_unit: detail?.wage_unit ?? fallback.salary_unit,
    work_area: detail?.work_area ?? fallback.work_area,
    experience_requirement: detail?.experience_requirement ?? "",
    language_requirement: detail?.language_requirement ?? "",
    includes_meals: Boolean(detail?.includes_meals),
    includes_housing: Boolean(detail?.includes_housing),
    identity_requirement: detail?.requires_work_authorization === null || detail?.requires_work_authorization === undefined ? "" : detail.requires_work_authorization ? "required" : "none",
    employer_type: detail?.employer_type ?? "",
  };
}

export function housingFieldsFromRecord(record: PostRecord, fallback: HousingFields): HousingFields {
  const detail = getHousingDetail(record);
  return {
    ...fallback,
    housing_mode: (detail?.listing_type || record.subcategory || fallback.housing_mode) as HousingFields["housing_mode"],
    price: detail?.rent_amount === null || detail?.rent_amount === undefined ? "" : String(detail.rent_amount),
    deposit: detail?.deposit_amount === null || detail?.deposit_amount === undefined ? "" : String(detail.deposit_amount),
    room_type: detail?.housing_type ?? "",
    lease_type: detail?.lease_term ?? "",
    available_from: detail?.available_date ?? "",
    allow_pets: Boolean(detail?.pets_allowed),
    utilities_included: Boolean(detail?.utilities_included),
    transit_nearby: detail?.transit_nearby ?? "",
  };
}

export function marketplaceFieldsFromRecord(record: PostRecord, fallback: MarketplaceFields): MarketplaceFields {
  const detail = getMarketplaceDetail(record);
  return {
    ...fallback,
    marketplace_mode: (detail?.listing_type || record.subcategory || fallback.marketplace_mode) as MarketplaceFields["marketplace_mode"],
    category: detail?.item_category ?? record.category ?? "",
    condition: detail?.condition ?? "",
    price: detail?.price_amount === null || detail?.price_amount === undefined ? "" : String(detail.price_amount),
    negotiable: Boolean(detail?.negotiable),
    trade_area: detail?.trade_area ?? fallback.trade_area,
    delivery_method: detail?.delivery_options?.[0] ?? "",
  };
}

export function serviceFieldsFromRecord(record: PostRecord, fallback: ServiceFields): ServiceFields {
  const detail = getServiceDetail(record);
  const businessHours = detail?.business_hours && typeof detail.business_hours === "object" && "text" in detail.business_hours ? String(detail.business_hours.text ?? "") : "";
  const price = getPostPriceDisplay(record);
  return {
    ...fallback,
    service_category: detail?.service_category ?? record.category ?? "",
    service_area: detail?.service_area ?? fallback.service_area,
    business_hours_text: businessHours,
    price_range: price,
    price_note: price,
  };
}

export function detailPayloadForForm(postId: string, values: PostFormValues) {
  if (values.postType === "job") {
    return {
      table: "post_details_jobs" as const,
      payload: {
        post_id: postId,
        employment_type: values.job?.job_type || null,
        wage_min: numericOrNull(values.job?.salary_min ?? ""),
        wage_max: numericOrNull(values.job?.salary_max ?? ""),
        wage_unit: values.job?.salary_unit || null,
        job_category: values.job?.job_category || null,
        work_area: values.job?.work_area || values.location_area || null,
        experience_requirement: values.job?.experience_requirement || null,
        language_requirement: values.job?.language_requirement || null,
        includes_meals: Boolean(values.job?.includes_meals),
        includes_housing: Boolean(values.job?.includes_housing),
        requires_work_authorization: values.job?.identity_requirement ? values.job.identity_requirement !== "none" : null,
        employer_type: values.job?.employer_type || values.job?.company_name || null,
        updated_at: new Date().toISOString(),
      },
    };
  }

  if (values.postType === "housing") {
    return {
      table: "post_details_housing" as const,
      payload: {
        post_id: postId,
        listing_type: values.housing?.housing_mode || null,
        housing_type: values.housing?.room_type || null,
        rent_amount: numericOrNull(values.housing?.price ?? ""),
        deposit_amount: numericOrNull(values.housing?.deposit ?? ""),
        available_date: values.housing?.available_from || null,
        lease_term: values.housing?.lease_type || values.housing?.price_unit || null,
        pets_allowed: Boolean(values.housing?.allow_pets),
        utilities_included: Boolean(values.housing?.utilities_included),
        transit_nearby: values.housing?.transit_nearby || null,
        address_area: values.location_area || null,
        updated_at: new Date().toISOString(),
      },
    };
  }

  if (values.postType === "marketplace") {
    return {
      table: "post_details_marketplace" as const,
      payload: {
        post_id: postId,
        listing_type: values.marketplace?.marketplace_mode || null,
        item_category: values.marketplace?.category || null,
        condition: values.marketplace?.condition || null,
        price_amount: numericOrNull(values.marketplace?.price ?? ""),
        negotiable: Boolean(values.marketplace?.negotiable),
        trade_area: values.marketplace?.trade_area || values.location_area || null,
        delivery_options: values.marketplace?.delivery_method ? [values.marketplace.delivery_method] : [],
        updated_at: new Date().toISOString(),
      },
    };
  }

  return {
    table: "post_details_services" as const,
    payload: {
      post_id: postId,
      service_category: values.service?.service_category || null,
      service_area: values.service?.service_area || values.location_area || null,
      business_hours: values.service?.business_hours_text ? { text: values.service.business_hours_text } : {},
      price_range: values.service?.price_range || values.service?.price_note || null,
      service_status: "active",
      updated_at: new Date().toISOString(),
    },
  };
}

export function supportsImages(postType: PostType) {
  return Boolean(postChannelConfig(postType).imageConfig);
}
