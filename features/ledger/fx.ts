export const fxFields = ["amount", "rate", "cny"] as const;
export type FxField = (typeof fxFields)[number];
type Values = Record<FxField, string>;

export function formatFx(value: number, field: FxField) {
  const digits = field === "rate" ? 3 : 2;
  const scale = 10 ** digits;
  return (Math.round((value + Number.EPSILON * Math.abs(value)) * scale) / scale).toFixed(digits);
}

export function calculate(values: Values, target: FxField): Values {
  if (fxFields.some(k => k !== target && !(Number(values[k]) > 0))) {
    return { ...values, [target]: "" };
  }
  const usd = Number(values.amount), rate = Number(values.rate), cny = Number(values.cny);
  const result = target === "amount" ? cny / rate : target === "rate" ? cny / usd : usd * rate;
  return { ...values, [target]: Number.isFinite(result) ? formatFx(result, target) : "" };
}

export function changeFx(values: Values, field: FxField, text: string, target: FxField, previous: FxField) {
  const next = { ...values, [field]: text };
  if (!text) return { values: next, target: field };
  const empty = fxFields.filter(k => next[k] === "");
  if (empty.length > 1) return { values: next, target };
  if (empty.length === 1) target = empty[0];
  else if (field === target) target = previous !== field ? previous : field === "cny" ? "rate" : "cny";
  return { values: calculate(next, target), target };
}

export function unusualRate(rate: number) {
  return rate > 0 && (rate < 5 || rate > 9);
}
