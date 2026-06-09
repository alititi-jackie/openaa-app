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

export const HOUSING_TYPE_OPTIONS = [
  {
    value: "rent",
    label: "出租",
    tone: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    amountLabel: "租金",
    amountSuffix: "/月",
    amountPlaceholder: "请输入租金，不填则不显示",
    timePlaceholder: "例：随时入住 / 7月初 / 8月底",
    aliases: ["supply", "renting", "rental", "for_rent", "房源信息", "房屋出租"],
  },
  {
    value: "sale",
    label: "出售",
    tone: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    amountLabel: "售价",
    amountSuffix: "",
    amountPlaceholder: "请输入售价，不填则不显示",
    timePlaceholder: "例：随时看房 / 近期可交易",
    aliases: ["selling", "sell", "for_sale", "房屋出售"],
  },
  {
    value: "rent_request",
    label: "求租",
    tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    amountLabel: "预算",
    amountSuffix: "/月",
    amountPlaceholder: "请输入预算，不填则不显示",
    timePlaceholder: "例：7月前后入住 / 越快越好",
    aliases: ["demand", "seeking_rent", "wanted_rent", "求租求购"],
  },
  {
    value: "buy_request",
    label: "求购",
    tone: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
    amountLabel: "购房预算",
    amountSuffix: "",
    amountPlaceholder: "请输入购房预算，不填则不显示",
    timePlaceholder: "例：近期购房 / 半年内",
    aliases: ["buying", "buy", "seeking_buy", "wanted_buy"],
  },
  {
    value: "other",
    label: "其它",
    tone: "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100",
    amountLabel: "金额",
    amountSuffix: "",
    amountPlaceholder: "请输入金额，不填则不显示",
    timePlaceholder: "例：时间要求",
    aliases: ["其他"],
  },
] as const;

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
export type HousingMode = (typeof HOUSING_TYPE_OPTIONS)[number]["value"];
export type SecondhandMode = (typeof SECONDHAND_MODE_OPTIONS)[number]["value"];

export function isOptionValue(options: readonly PostOption[], value?: string | null) {
  return Boolean(value && options.some((option) => option.value === value));
}

export function housingTypeFromValue(value?: string | null): HousingMode | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;

  const option = HOUSING_TYPE_OPTIONS.find(
    (item) =>
      item.value.toLowerCase() === normalized ||
      item.label.toLowerCase() === normalized ||
      item.aliases.some((alias) => alias.toLowerCase() === normalized),
  );

  return option?.value;
}

export function normalizeHousingType(value?: string | null): HousingMode {
  return housingTypeFromValue(value) ?? "other";
}

export function housingTypeOption(value?: string | null) {
  const normalized = normalizeHousingType(value);
  return HOUSING_TYPE_OPTIONS.find((option) => option.value === normalized) ?? HOUSING_TYPE_OPTIONS[HOUSING_TYPE_OPTIONS.length - 1];
}
