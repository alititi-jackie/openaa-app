import { BriefcaseBusiness, Building2, ShoppingBag, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { POST_TYPE_TO_ROUTE } from "./constants";
import { POST_IMAGE_CONFIG } from "./imageConfig";
import {
  HOUSING_TYPE_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  JOB_MODE_OPTIONS,
  JOB_TYPE_OPTIONS,
  LOCATION_OPTIONS,
  SECONDHAND_CATEGORY_OPTIONS,
  SECONDHAND_MODE_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  type PostOption,
} from "./options";
import type { PostType } from "./types";

export type PostChannelConfig = {
  type: PostType;
  channelKey: "jobs" | "housing" | "marketplace" | "services";
  route: string;
  publishRoute: string;
  manageRoute: string;
  displayLabel: string;
  icon: LucideIcon;
  modeOptions?: readonly PostOption[];
  workTypeOptions?: readonly PostOption[];
  categoryOptions?: readonly PostOption[];
  areaOptions: readonly PostOption[];
  imageConfig?: typeof POST_IMAGE_CONFIG;
  detailLabels: {
    area: string;
    mode?: string;
    category?: string;
    price?: string;
    secondary?: string;
    status?: string;
  };
  form: {
    defaultMode?: string;
    defaultSalaryUnit?: string;
    defaultPriceUnit?: string;
  };
};

export const POST_CHANNEL_CONFIGS: Record<PostType, PostChannelConfig> = {
  job: {
    type: "job",
    channelKey: "jobs",
    route: POST_TYPE_TO_ROUTE.job,
    publishRoute: "/jobs/publish",
    manageRoute: "/profile/jobs",
    displayLabel: "招聘",
    icon: BriefcaseBusiness,
    modeOptions: JOB_MODE_OPTIONS,
    workTypeOptions: JOB_TYPE_OPTIONS,
    categoryOptions: JOB_CATEGORY_OPTIONS,
    areaOptions: LOCATION_OPTIONS,
    detailLabels: { area: "地区", mode: "类型", category: "职位分类", price: "薪资", secondary: "类型" },
    form: { defaultMode: "hiring", defaultSalaryUnit: "hour" },
  },
  housing: {
    type: "housing",
    channelKey: "housing",
    route: POST_TYPE_TO_ROUTE.housing,
    publishRoute: "/housing/publish",
    manageRoute: "/profile/housing",
    displayLabel: "房屋",
    icon: Building2,
    modeOptions: HOUSING_TYPE_OPTIONS,
    areaOptions: LOCATION_OPTIONS,
    imageConfig: POST_IMAGE_CONFIG,
    detailLabels: { area: "地区", mode: "类型", category: "房型", price: "金额", secondary: "房型" },
    form: { defaultMode: "", defaultPriceUnit: "month" },
  },
  marketplace: {
    type: "marketplace",
    channelKey: "marketplace",
    route: POST_TYPE_TO_ROUTE.marketplace,
    publishRoute: "/secondhand/publish",
    manageRoute: "/profile/secondhand",
    displayLabel: "二手",
    icon: ShoppingBag,
    modeOptions: SECONDHAND_MODE_OPTIONS,
    categoryOptions: SECONDHAND_CATEGORY_OPTIONS,
    areaOptions: LOCATION_OPTIONS,
    imageConfig: POST_IMAGE_CONFIG,
    detailLabels: { area: "地区", mode: "出售/求购", category: "分类", price: "价格", secondary: "分类", status: "状态" },
    form: { defaultMode: "selling" },
  },
  service: {
    type: "service",
    channelKey: "services",
    route: POST_TYPE_TO_ROUTE.service,
    publishRoute: "/services/publish",
    manageRoute: "/profile/services",
    displayLabel: "本地服务",
    icon: Store,
    categoryOptions: SERVICE_CATEGORY_OPTIONS,
    areaOptions: LOCATION_OPTIONS,
    imageConfig: POST_IMAGE_CONFIG,
    detailLabels: { area: "地区", category: "服务分类", price: "价格", secondary: "服务分类" },
    form: {},
  },
};

export function postChannelConfig(postType: PostType) {
  return POST_CHANNEL_CONFIGS[postType];
}
