"use client";
import { useState } from "react";
import { TextInput } from "@/components/forms/TextInput";
import {
  categories,
  names,
  today,
  validate,
  type Entry,
  type Kind,
} from "./model";
import { writeEntries } from "./store";
export function EntryForm({
  kind,
  owner,
  original,
  done,
  cancel,
  onEdit,
}: {
  kind: Kind;
  owner: string;
  original?: Entry;
  done: () => void;
  onEdit: () => void;
  cancel: () => void;
}) {
  const fx = kind === "remittance";
  const [id] = useState(() => original?.id ?? crypto.randomUUID()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [target, setTarget] = useState("cny"),
    [fields, setFields] = useState<Record<string, string>>({
      amount: original ? String(Math.abs(original.amount)) : "",
      rate: original?.rate?.toString() ?? "",
      cny: original?.cny != null ? String(Math.abs(original.cny)) : "",
    });
  function calculated(values: Record<string, string>, key: string) {
    const { amount, rate, cny } = values;
    let value: number;
    if (key === "rate") value = cny && amount ? +cny / +amount : NaN;
    else if (key === "amount") value = cny && rate ? +cny / +rate : NaN;
    else value = amount && rate ? +amount * +rate : NaN;
    return {
      ...values,
      [key]: Number.isFinite(value)
        ? value.toFixed(key === "rate" ? 3 : 2)
        : "",
    };
  }
  return (
    <form onChange={onEdit}
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget),
          sign = f.get("type") === "subtract" ? -1 : 1;
        try {
          const entry = validate({
            id,
            kind,
            date: String(f.get("date")),
            amount: sign * Number(fields.amount),
            rate: fx ? Number(fields.rate) : null,
            cny: fx ? sign * Number(fields.cny) : null,
            method: f.get("method") as Entry["method"],
            category: f.get("category") as string | null,
            note: String(f.get("note") ?? ""),
          });
          await writeEntries(owner, [
            { ...entry, expected: original?.revision },
          ]);
          done();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>
        {original ? "编辑" : "记一笔"}
        {names[kind]}
      </h2>
      <label className="block min-w-0 max-w-full">
        日期
        <TextInput
          required
          type="date"
          className="block min-w-0 max-w-full box-border appearance-none text-left [&::-webkit-date-and-time-value]:text-left"
          name="date"
          defaultValue={original?.date ?? today()}
        />
      </label>
      {fx && (
        <label>
          记录类型
          <select
            name="type"
            defaultValue={original && original.amount < 0 ? "subtract" : "add"}
          >
            <option value="add">汇出</option>
            <option value="subtract">减去（冲正）</option>
          </select>
        </label>
      )}
      {(fx ? ["amount", "rate", "cny"] : ["amount"]).map((k) => (
        <label key={k} className="block">
          {{ amount: "美元金额", rate: "汇率", cny: "人民币金额" }[k]}
          <TextInput
            required
            type="number"
            step={k === "rate" ? "any" : "0.01"}
            min={k === "rate" ? "0.0000000001" : "0.01"}
            inputMode="decimal"
            readOnly={fx && target === k}
            value={fields[k]}
            onChange={(e) => {
              const values = { ...fields, [k]: e.target.value };
              setFields(fx ? calculated(values, target) : values);
            }}
          />
        </label>
      ))}
      {fx ? (
        <fieldset>
          <legend>计算哪一项</legend>
          {[
            ["amount", "美元"],
            ["rate", "汇率"],
            ["cny", "人民币"],
          ].map(([v, l]) => (
            <button
              type="button"
              key={v}
              aria-pressed={v === target}
              onClick={() => {
                setTarget(v);
                setFields(calculated(fields, v));
              }}
            >
              {l}
            </button>
          ))}
        </fieldset>
      ) : (
        <fieldset>
          <legend>{kind === "income" ? "收款方式" : "支付方式"}</legend>
          {[
            ["cash", "现金"],
            ["card", "银行卡"],
          ].map(([v, l]) => (
            <label className="mr-4" key={v}>
              <input
                type="radio"
                required
                name="method"
                value={v}
                defaultChecked={original?.method === v}
              />{" "}
              {l}
            </label>
          ))}
        </fieldset>
      )}
      {kind === "expense" && (
        <fieldset>
          <legend>开支分类</legend>
          <div className="grid grid-cols-3 gap-2">
            {Array.from(
              new Set([
                ...categories,
                ...(original?.category ? [original.category] : []),
              ]),
            ).map((c) => (
              <label key={c}>
                <input
                  required
                  type="radio"
                  name="category"
                  value={c}
                  defaultChecked={original?.category === c}
                />{" "}
                {c}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className="block">
        备注（选填）
        <TextInput
          name="note"
          maxLength={10000}
          defaultValue={original?.note}
        />
      </label>
      <button disabled={busy} type="button" onClick={cancel}>
        取消
      </button>{" "}
      <button disabled={busy}>{busy ? "保存中…" : "保存"}</button>
      <p role="alert">{error}</p>
    </form>
  );
}
