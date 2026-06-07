export type PostOption<T extends string = string> = {
  value: T;
  label: string;
};

export const EMPTY_LOCATION = "";

export const LOCATION_OPTIONS = [
  { value: "纽约 New York", label: "纽约 New York" },
  { value: "法拉盛 Flushing", label: "法拉盛 Flushing" },
  { value: "皇后区 Queens", label: "皇后区 Queens" },
  { value: "布鲁克林 Brooklyn", label: "布鲁克林 Brooklyn" },
  { value: "曼哈顿 Manhattan", label: "曼哈顿 Manhattan" },
  { value: "布朗士 Bronx", label: "布朗士 Bronx" },
  { value: "史登岛 Staten Island", label: "史登岛 Staten Island" },
  { value: "长岛 Long Island", label: "长岛 Long Island" },
  { value: "上州纽约 Upstate NY", label: "上州纽约 Upstate NY" },
  { value: "新泽西 New Jersey", label: "新泽西 New Jersey" },
  { value: "其它地区 Other", label: "其它地区 Other" },
] as const satisfies readonly PostOption[];

export const DEFAULT_LOCATION = LOCATION_OPTIONS[0].value;

export const JOB_MODE_OPTIONS = [
  { value: "hiring", label: "招聘岗位" },
  { value: "seeking", label: "求职人才" },
] as const satisfies readonly PostOption[];

export const JOB_TYPE_OPTIONS = [
  { value: "全职", label: "全职" },
  { value: "兼职", label: "兼职" },
  { value: "合同", label: "合同" },
  { value: "远程", label: "远程" },
  { value: "实习", label: "实习" },
  { value: "其它", label: "其它" },
] as const satisfies readonly PostOption[];

export const JOB_CATEGORY_OPTIONS = [
  { value: "餐饮行业", label: "餐饮行业" },
  { value: "美容按摩", label: "美容按摩" },
  { value: "装修建筑", label: "装修建筑" },
  { value: "文职运营", label: "文职运营" },
  { value: "医疗药房", label: "医疗药房" },
  { value: "家政保姆", label: "家政保姆" },
  { value: "司机送货", label: "司机送货" },
  { value: "门店零售", label: "门店零售" },
  { value: "仓库工厂", label: "仓库工厂" },
  { value: "汽车维修", label: "汽车维修" },
  { value: "酒吧KTV", label: "酒吧KTV" },
  { value: "教师培训", label: "教师培训" },
  { value: "技术人才", label: "技术人才" },
  { value: "其它职位", label: "其它职位" },
] as const satisfies readonly PostOption[];

export const HOUSING_MODE_OPTIONS = [
  { value: "supply", label: "房源信息" },
  { value: "demand", label: "求租求购" },
] as const satisfies readonly PostOption[];

export const SECONDHAND_MODE_OPTIONS = [
  { value: "selling", label: "出售商品" },
  { value: "buying", label: "求购信息" },
] as const satisfies readonly PostOption[];

export const SECONDHAND_CATEGORY_OPTIONS = [
  { value: "生活用品", label: "生活用品" },
  { value: "母婴用品", label: "母婴用品" },
  { value: "电子产品", label: "电子产品" },
  { value: "服饰箱包", label: "服饰箱包" },
  { value: "办公用品", label: "办公用品" },
  { value: "宠物", label: "宠物" },
  { value: "家具家电", label: "家具家电" },
  { value: "其它二手", label: "其它二手" },
] as const satisfies readonly PostOption[];

export const SERVICE_CATEGORY_OPTIONS = [
  { value: "装修维修", label: "装修维修" },
  { value: "搬家运输", label: "搬家运输" },
  { value: "家政清洁", label: "家政清洁" },
  { value: "房地产", label: "房地产" },
  { value: "汽车相关", label: "汽车相关" },
  { value: "法律移民", label: "法律移民" },
  { value: "财税保险", label: "财税保险" },
  { value: "电脑手机", label: "电脑手机" },
  { value: "餐饮商业", label: "餐饮商业" },
  { value: "教育培训", label: "教育培训" },
  { value: "其它服务", label: "其它服务" },
] as const satisfies readonly PostOption[];

export type JobMode = (typeof JOB_MODE_OPTIONS)[number]["value"];
export type HousingMode = (typeof HOUSING_MODE_OPTIONS)[number]["value"];
export type SecondhandMode = (typeof SECONDHAND_MODE_OPTIONS)[number]["value"];

export function isOptionValue(options: readonly PostOption[], value?: string | null) {
  return Boolean(value && options.some((option) => option.value === value));
}
