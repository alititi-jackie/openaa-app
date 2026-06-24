import type { PostType } from "./types";
import type { HousingMode, JobMode, MarketplaceMode } from "./options";

export type ContactInput = {
  contact_name: string;
  phone: string;
  wechat: string;
  email: string;
  preferred_contact_method: "" | "phone" | "wechat" | "email";
};

export type PublishContactDefaults = {
  contact_name?: string | null;
  phone?: string | null;
  wechat?: string | null;
  email?: string | null;
  location_area?: string | null;
  preferred_contact_method?: string | null;
};

export type UploadedImageInput = {
  imageAssetId?: string;
  url: string;
  path?: string;
  caption?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
  file?: File;
};

export type BasePostFormValues = {
  postType: PostType;
  mode: "create" | "edit";
  postId?: string;
  title: string;
  summary: string;
  body: string;
  location_area: string;
  visibility: "public" | "private";
  contact: ContactInput;
  images: UploadedImageInput[];
};

export type JobFields = {
  job_mode: JobMode;
  company_name: string;
  job_category: string;
  job_type: string;
  salary_min: string;
  salary_max: string;
  salary_unit: string;
  work_area: string;
  experience_requirement: string;
  language_requirement: string;
  includes_meals: boolean;
  includes_housing: boolean;
  identity_requirement: string;
  employer_type: string;
};

export type HousingFields = {
  housing_mode: HousingMode | "";
  price: string;
  price_unit: string;
  deposit: string;
  room_type: string;
  lease_type: string;
  available_from: string;
  allow_pets: boolean;
  utilities_included: boolean;
  transit_nearby: string;
};

export type MarketplaceFields = {
  marketplace_mode: MarketplaceMode;
  category: string;
  condition: string;
  price: string;
  negotiable: boolean;
  trade_area: string;
  delivery_method: string;
};

export type ServiceFields = {
  service_category: string;
  service_area: string;
  business_hours_text: string;
  price_range: string;
  price_note: string;
  business_profile_user_id: string;
};

export type PostFormValues = BasePostFormValues & {
  job?: JobFields;
  housing?: HousingFields;
  marketplace?: MarketplaceFields;
  service?: ServiceFields;
};

export type PostFormErrors = Partial<Record<string, string>>;

export type PostFormActionResult =
  | { ok: true; postId: string; href: string }
  | { ok: false; message: string; fieldErrors?: PostFormErrors };
