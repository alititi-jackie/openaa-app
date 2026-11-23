"use client";
import { useRef, useState } from "react";
import { TextInput } from "@/components/forms/TextInput";
import {
  categories,
  names,
  today,
  validate,
  type Entry,
  type Kind,
} from "./model";
import {
  calculate,
  changeFx,
  formatFx,
  fxFields,
  unusualRate,
  type FxField,
} from "./fx";
import { writeEntries } from "./store";
export function EntryForm({
  kind,
  owner,
  onBusy,
  original,
  done,
  cancel,
  onEdit,
}: {
  kind: Kind;
  onBusy: (busy: boolean) => void;
  owner: string;
  original?: Entry;
  done: () => void;
  onEdit: () => void;
  cancel: () => void;
}) {
  const [missing, setMissing] = useState({ method: false, category: false });
  const fx = kind === "remittance";
  const [id] = useState(() => original?.id ?? crypto.randomUUID()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [target, setTarget] = useState<FxField>("cny"),
    [fields, setFields] = useState<Record<FxField, string>>({
      amount: original ? String(Math.abs(original.amount)) : "",
      rate: original?.rate != null ? formatFx(original.rate, "rate") : "",
      cny: original?.cny != null ? String(Math.abs(original.cny)) : "",
    });
  const previous = useRef<FxField>("rate");
  const dialog = useRef<HTMLDialogElement>(null);
  const [typingRate, setTypingRate] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  async function confirmTransfer(messages: string[]) {
    const modal = dialog.current;
    if (!modal) return false;
    setWarnings(messages);
    modal.returnValue = "";
    const answer = new Promise<boolean>((resolve) => {
      modal.addEventListener(
        "close",
        () => resolve(modal.returnValue === "save"),
        { once: true },
      );
    });
    modal.showModal();
    return answer;
  }
  return (
    <form
      onInvalid={(e) => {
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) return;
        if (input.name === "method" || input.name === "category")
          setMissing((m) => ({ ...m, [input.name]: true }));
      }}
      onChange={(e) => {
        onEdit();
        const input = e.target;
        if (!(input instanceof HTMLInputElement)) return;
        if (input.name === "method" || input.name === "category")
          setMissing((m) => ({ ...m, [input.name]: false }));
      }}
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        onBusy(true);
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
          if (
            kind === "expense" &&
            (entry.amount < 1 || entry.amount > 10000) &&
            !(await confirmTransfer([
              "开支金额为 $" + entry.amount.toFixed(2) + "，请核对金额。",
            ]))
          )
            return;
          if (fx) {
            const messages = [];
            const amount = Math.abs(entry.amount);
            if (amount < 20 || amount > 100000)
              messages.push(
                "汇款金额为 $" + amount.toFixed(2) + "，请核对金额。",
              );
            if (entry.rate != null && unusualRate(entry.rate))
              messages.push(
                "当前汇率为 " +
                  entry.rate.toFixed(3) +
                  "，可能有误。确认按此汇率保存吗？",
              );
            if (messages.length && !(await confirmTransfer(messages))) return;
          }
          await writeEntries(owner, [
            { ...entry, expected: original?.revision },
          ]);
          done();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
          onBusy(false);
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
      {(fx ? fxFields : (["amount"] as const)).map((k) => (
        <label key={k} className="block">
          {
            {
              amount: "美元金额",
              rate: "汇率（1 美元兑换人民币）",
              cny: "人民币金额（CNY）",
            }[k]
          }
          <TextInput
            required
            type="number"
            step={k === "rate" ? "any" : "0.01"}
            min={k === "rate" ? "0.0000000001" : "0.01"}
            inputMode="decimal"
            aria-describedby={k === "rate" ? "ledger-rate-warning" : undefined}
            onBlur={(e) => {
              if (!fx) return;
              if (k === "rate") setTypingRate(false);
              const raw = e.currentTarget.value;
              if (!raw || !(Number(raw) > 0)) return;
              const rounded = formatFx(Number(raw), k);
              const next = { ...fields, [k]: rounded };
              setFields(
                k !== target && Number(rounded) !== Number(raw)
                  ? calculate(next, target)
                  : next,
              );
            }}
            value={fields[k]}
            onChange={(e) => {
              if (!fx) return setFields({ ...fields, [k]: e.target.value });
              const next = changeFx(
                fields,
                k,
                e.target.value,
                target,
                previous.current,
              );
              previous.current = k;
              setTypingRate(k === "rate");
              setTarget(next.target);
              setFields(next.values);
            }}
          />
          {k === "rate" && (
            <small
              id="ledger-rate-warning"
              aria-live="polite"
              className="text-amber-800"
            >
              {!typingRate && unusualRate(Number(fields.rate))
                ? "⚠ 汇率可能有误，请核对。"
                : ""}
            </small>
          )}
        </label>
      ))}
      {fx ? (
        <fieldset>
          <legend>计算哪一项</legend>
          {(
            [
              ["amount", "美元"],
              ["rate", "汇率"],
              ["cny", "人民币"],
            ] as const
          ).map(([v, l]) => (
            <button
              type="button"
              key={v}
              aria-pressed={v === target}
              onClick={() => {
                setTarget(v);
                setFields(calculate(fields, v));
                setTypingRate(false);
                onEdit();
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
          {missing.method && (
            <small role="alert" className="text-red-700">
              请选择{kind === "income" ? "收款方式" : "支付方式"}
            </small>
          )}
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
          {missing.category && (
            <small role="alert" className="text-red-700">
              请选择开支分类
            </small>
          )}
        </fieldset>
      )}
      <label className="block">
        备注（选填）
        <textarea
          rows={2}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          name="note"
          maxLength={10000}
          defaultValue={original?.note}
        />
      </label>
      <button disabled={busy} type="button" onClick={cancel}>
        取消
      </button>{" "}
      <button disabled={busy}>{busy ? "保存中…" : "保存"}</button>
      <dialog
        ref={dialog}
        aria-labelledby="review-transfer"
        className="fixed inset-0 m-auto w-[min(92vw,28rem)] space-y-4 rounded-2xl bg-white p-5 shadow-xl backdrop:bg-black/40"
      >
        <h2 id="review-transfer">请核对{fx ? "汇款" : "开支"}记录</h2>
        <p className="whitespace-pre-line">{warnings.join("\n")}</p>
        <div className="flex gap-3">
          <button
            type="button"
            autoFocus
            onClick={() => dialog.current?.close("revise")}
          >
            返回修改
          </button>
          <button type="button" onClick={() => dialog.current?.close("save")}>
            确认保存
          </button>
        </div>
      </dialog>
      <p role="alert">{error}</p>
    </form>
  );
}
