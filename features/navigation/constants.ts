export const NAVIGATION_PUBLIC_LIMIT = 300;
export const ADMIN_NAVIGATION_LIMIT = 300;

export const NAVIGATION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ALLOWED_NAVIGATION_IMAGE_HOSTS = new Set(["img.openaa.com"]);
export const OPENAA_INTERNAL_HOSTS = ["openaa.com", "ny.openaa.com"];

export const DEFAULT_NAVIGATION_CATEGORIES = [
  { slug: "featured", name: "热门推荐", description: "", icon: null, sort_order: 10, display_limit: 50, is_active: true },
  { slug: "government", name: "政府服务", description: "", icon: null, sort_order: 20, display_limit: 50, is_active: true },
  { slug: "finance", name: "银行金融", description: "", icon: null, sort_order: 30, display_limit: 50, is_active: true },
  { slug: "shopping", name: "购物平台", description: "", icon: null, sort_order: 40, display_limit: 50, is_active: true },
  { slug: "telecom", name: "通讯网络", description: "", icon: null, sort_order: 50, display_limit: 50, is_active: true },
  { slug: "ai", name: "AI工具", description: "", icon: null, sort_order: 60, display_limit: 50, is_active: true },
  { slug: "video", name: "视频娱乐", description: "", icon: null, sort_order: 70, display_limit: 50, is_active: true },
  { slug: "social", name: "社交媒体", description: "", icon: null, sort_order: 80, display_limit: 50, is_active: true },
  { slug: "life", name: "生活服务", description: "", icon: null, sort_order: 90, display_limit: 50, is_active: true },
  { slug: "other", name: "其它", description: "", icon: null, sort_order: 100, display_limit: 50, is_active: true },
];

export const NAVIGATION_DEFAULT_DESCRIPTION = "OpenAA 美国华人常用网站导航入口。";
