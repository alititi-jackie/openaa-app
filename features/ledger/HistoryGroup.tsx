"use client";
import { useEffect, useState, type ReactNode } from "react";
import { readPage } from "./store";
import { money, type Entry, type Kind } from "./model";

export function HistoryGroup({
  owner,
  book,
  period,
  category,
  search,
  count,
  amount,
  render,
}: {
  owner: string;
  book: Kind | "summary";
  period: string;
  category: string | null;
  search: string;
  count: number;
  amount: number;
  render: (rows: Entry[]) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Entry[]>([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!open) return;
    let active = true;
    readPage(owner, book, period, category, search, offset, 30).then(
      (result) => {
        if (active) {
          setRows((previous) => previous.slice(0, offset).concat(result.rows));
          setError("");
        }
      },
      () => {
        if (active) setError("读取失败，点击重试");
      },
    );
    return () => {
      active = false;
    };
  }, [open, owner, book, period, category, search, offset, retry]);
  return (
    <details
      className="rounded-xl border p-3"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer font-semibold">
        {period} · {count} 笔 · ${money(amount)}
      </summary>
      {open && (
        <>
          {render(rows)}
          {error ? (
            <button onClick={() => setRetry((n) => n + 1)}>{error}</button>
          ) : rows.length <= offset ? (
            <p role="status">读取中…</p>
          ) : (
            rows.length < count && (
              <button onClick={() => setOffset(rows.length)}>显示更多</button>
            )
          )}
        </>
      )}
    </details>
  );
}
