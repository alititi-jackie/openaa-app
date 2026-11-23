export const names = {
  expense: "开支",
  income: "收入",
  remittance: "汇款",
} as const;
export type Kind = keyof typeof names;
export const kinds = Object.keys(names) as Kind[];
export const categories = ["购物", "餐饮", "交通", "房屋", "账单", "其它"];
export type Entry = {
  id: string;
  kind: Kind;
  date: string;
  amount: number;
  method: "cash" | "card" | null;
  category: string | null;
  cny: number | null;
  rate: number | null;
  note: string;
  revision?: string;
  created_at?: string;
};
export const today = () => new Date().toLocaleDateString("sv-SE");
export const money = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export function matches(r: Entry, term: string) {
  const q = term.trim().toLowerCase(),
    num = q.replace(/^[$¥￥]/, "").replaceAll(",", "");
  if (!q) return true;
  if (!/^[$¥￥]/.test(q) && r.note.toLowerCase().includes(q)) return true;
  const amounts = q.startsWith("$")
    ? [r.amount]
    : /^[¥￥]/.test(q)
      ? [r.cny]
      : [r.amount, r.cny];
  return !!num && amounts.some((a) => a != null && a.toFixed(2).includes(num));
}
export const fingerprint = (r: Entry) =>
  JSON.stringify([
    r.kind,
    r.date,
    r.amount,
    r.method,
    r.category,
    r.cny,
    r.rate,
    r.note,
  ]);
export function validate(r: Entry) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(r.date) ||
    new Date(r.date + "T12:00Z").toJSON()?.slice(0, 10) !== r.date
  )
    throw Error("日期无效");
  if (
    !Number.isFinite(r.amount) ||
    !r.id ||
    r.id.length > 200 ||
    r.note.length > 10000
  )
    throw Error("金额、编号或备注无效");
  if (r.kind === "remittance") {
    if (
      r.cny == null ||
      !Number.isFinite(r.cny) ||
      r.rate == null ||
      !Number.isFinite(r.rate) ||
      r.rate < 0 ||
      (r.rate === 0 && (r.amount !== 0 || r.cny !== 0)) ||
      r.amount * r.cny < 0
    )
      throw Error("请核对人民币金额和汇率");
  } else if (
    r.amount < 0 ||
    !r.method ||
    !["cash", "card"].includes(r.method) ||
    (r.kind === "expense" && !r.category)
  )
    throw Error("请选择收付方式及开支分类，并核对金额");
  return r;
}

export function totalColor(role: "expense" | "income" | "net", value: number) {
  if (role === "expense") return "#B42318";
  if (role === "income") return "#1976D2";
  return value < 0 ? "#B42318" : value > 0 ? "#1976D2" : "#000000";
}
