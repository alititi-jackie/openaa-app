export const NAVIGATION_PUBLIC_LIMIT = 120;
export const ADMIN_NAVIGATION_LIMIT = 200;

export const NAVIGATION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ALLOWED_NAVIGATION_IMAGE_HOSTS = new Set(["img.openaa.com"]);

export const DEFAULT_NAVIGATION_CATEGORIES = [
  { slug: "common", name: "常用网站", description: "纽约华人常用网站与服务入口。", icon: "Star", sort_order: 10, is_active: true },
  { slug: "government", name: "政府办事", description: "纽约、纽约州与联邦政府常用办事入口。", icon: "Landmark", sort_order: 20, is_active: true },
  { slug: "dmv-license", name: "DMV / 驾照", description: "DMV、驾照、车辆与罚单相关入口。", icon: "Car", sort_order: 30, is_active: true },
  { slug: "transportation", name: "交通出行", description: "公共交通、机场、停车与出行工具。", icon: "Train", sort_order: 40, is_active: true },
  { slug: "life-services", name: "生活服务", description: "水电网、医疗、学校与社区生活服务。", icon: "Wrench", sort_order: 50, is_active: true },
  { slug: "community", name: "华人社区", description: "华人社区、公益组织与本地信息入口。", icon: "Users", sort_order: 60, is_active: true },
];

export const NAVIGATION_DEFAULT_DESCRIPTION = "OpenAA 纽约华人常用导航入口。";
