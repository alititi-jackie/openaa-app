"use client";
import { Plus, CalendarDays, Share2, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
import { TextInput } from "@/components/forms/TextInput";
import { EntryForm } from "./EntryForm";
import { Transfer } from "./Transfer";
import { readEntries, writeEntries } from "./store";
import {
  categories,
  kinds,
  matches,
  money,
  names,
  today,
  type Entry,
  type Kind,
} from "./model";
type Book = Kind | "summary";
const bookNames = { ...names, summary: "收支总览" };
const modes = {
  full: "完整账本",
  expense: "开支版",
  income: "收入版",
  remittance: "汇款版",
};
const categoryTabs = ["all", ...categories].map((v) => ({
  value: v,
  label: v === "all" ? "全部" : v,
}));
const sum = (rows: Entry[], field: "amount" | "cny" = "amount") =>
  rows.reduce((n, r) => n + Math.round((r[field] ?? 0) * 100), 0) / 100;
function stats(rows: Entry[], book: Book) {
  if (book === "summary") {
    const [expense, income, remit] = kinds.map((k) =>
      sum(rows.filter((r) => r.kind === k)),
    );
    return [
      ["收入", "$" + money(income)],
      ["开支", "$" + money(expense)],
      ["收支结余", "$" + money(income - expense)],
      ["净汇出美元", "$" + money(remit)],
      ["汇款后结余", "$" + money(income - expense - remit)],
      ["折合人民币", "¥" + money(sum(rows, "cny"))],
    ];
  }
  if (book === "remittance") {
    const usd = rows.reduce((n, r) => n + Math.abs(r.amount), 0);
    return [
      ["净汇出美元", "$" + money(sum(rows))],
      ["折合人民币", "¥" + money(sum(rows, "cny"))],
      [
        "平均汇率",
        usd
          ? (rows.reduce((n, r) => n + Math.abs(r.cny ?? 0), 0) / usd).toFixed(
              3,
            )
          : "—",
      ],
      ["笔数", rows.length],
    ];
  }
  return [
    [names[book] + "总额", "$" + money(sum(rows))],
    ["现金", "$" + money(sum(rows.filter((r) => r.method === "cash")))],
    ["银行卡", "$" + money(sum(rows.filter((r) => r.method === "card")))],
    ["笔数", rows.length],
  ];
}
export function Ledger({
  owner,
  initialMode,
}: {
  owner: string;
  initialMode: keyof typeof modes;
}) {
  const [mode, setMode] = useState<keyof typeof modes>(initialMode),
    [book, setBook] = useState<Book>(
      initialMode === "full" ? "expense" : initialMode,
    ),
    [page, setPage] = useState("home"),
    [original, setOriginal] = useState<Entry>();
  const [period, setPeriod] = useState("month"),
    [month, setMonth] = useState(today().slice(0, 7)),
    [year, setYear] = useState(today().slice(0, 4)),
    [q, setQ] = useState(""),
    [cat, setCat] = useState("all"),
    [limit, setLimit] = useState(30),
    [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<{
      key: string;
      rows: Entry[];
      error?: string;
    }>(),
    [message, setMessage] = useState("");
  const prefix =
    page === "home"
      ? today().slice(0, 7)
      : period === "month"
        ? month
        : period === "year"
          ? year
          : "";
  const key = [owner, book, prefix, page, refresh].join("|");
  useEffect(() => {
    if (page === "form" || page === "transfer") return;
    let live = true;
    readEntries(owner, prefix, book === "summary" ? undefined : book).then(
      (rows) => {
        if (live) setData({ key, rows });
      },
      () => {
        if (live) setData({ key, rows: [], error: "读取失败，请重试" });
      },
    );
    return () => {
      live = false;
    };
  }, [owner, prefix, book, page, key]);
  const rows = data?.key === key ? data.rows : [],
    filtered = rows.filter(
      (r) =>
        (book !== "expense" || cat === "all" || r.category === cat) &&
        matches(r, q),
    );
  function open(next: string) {
    setMessage("");
    setPage(next);
    setOriginal(undefined);
    setLimit(30);
    if (next === "view") {
      setCat("all");
      setQ("");
    }
  }
  function switchBook(v: Book) {
    setBook(v);
    open("home");
  }
  const shown = page === "home" ? rows : filtered;
  function entries(list: Entry[]) {
    return list.map((r) => (
      <article className="border-t py-3" key={r.kind + r.id}>
        <strong>
          {r.category ?? names[r.kind]} · ${money(r.amount)}
        </strong>
        <div className="text-sm text-zinc-600">
          {r.date} ·{" "}
          {r.kind === "remittance"
            ? "¥" + money(r.cny ?? 0) + " · 汇率 " + r.rate
            : r.method === "cash"
              ? "现金"
              : "银行卡"}{" "}
          {r.note}
        </div>
        {page === "view" && (
          <>
            <button
              onClick={() => {
                setBook(r.kind);
                open("form");
                setOriginal(r);
              }}
            >
              编辑
            </button>{" "}
            <button
              onClick={async () => {
                if (!confirm("确认删除这笔记录？")) return;
                try {
                  await writeEntries(owner, [
                    { ...r, expected: r.revision, remove: true },
                  ]);
                  setRefresh((v) => v + 1);
                  setMessage("已删除");
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              删除
            </button>
          </>
        )}
      </article>
    ));
  }
  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm [&_button:not([role])]:cursor-pointer [&_button]:rounded-xl [&_button]:border [&_button]:border-blue-100 [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm [&_button]:font-semibold [&_button[aria-pressed=true]]:bg-blue-600 [&_button[aria-pressed=true]]:text-white [&_h2]:text-lg [&_h2]:font-bold">
      <h1 className="text-2xl font-bold">生活收支账本</h1>
      {mode === "full" && page === "home" && (
        <HorizontalPillTabs
          tabs={Object.entries(bookNames).map(([value, label]) => ({
            value,
            label,
          }))}
          activeValue={book}
          ariaLabel="账本"
          onChange={(v) => switchBook(v as Book)}
        />
      )}
      {page !== "home" && page !== "form" && (
        <button onClick={() => open("home")}>‹ 返回账本</button>
      )}
      {page === "form" && book !== "summary" ? (
        <EntryForm
          owner={owner}
          kind={book}
          original={original}
          cancel={() => open(original ? "view" : "home")}
          done={() => {
            open(original ? "view" : "home");
            setRefresh((v) => v + 1);
            setMessage("已保存");
          }}
        />
      ) : page === "transfer" ? (
        <Transfer owner={owner} done={() => setRefresh((v) => v + 1)} />
      ) : (
        <>
          <h2>
            {bookNames[book]}
            {book !== "summary" ? "账本" : ""}
          </h2>
          {page === "home" ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  target: "form",
                  title: "记一笔",
                  hint: "记录金额、日期和备注",
                  icon: Plus,
                },
                {
                  target: "view",
                  title: "查看",
                  hint: "按月份、年度查看明细",
                  icon: CalendarDays,
                },
                {
                  target: "transfer",
                  title: "导出／分享",
                  hint: "Excel 表格和账本导入",
                  icon: Share2,
                },
              ]
                .filter(
                  (action) => book !== "summary" || action.target !== "form",
                )
                .map(({ target, title, hint, icon: Icon }) => (
                  <button
                    key={target}
                    className="flex items-center gap-3 text-left"
                    onClick={() => open(target)}
                  >
                    <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
                      <Icon size={20} />
                    </span>
                    <span className="flex-1">
                      <strong className="block">{title}</strong>
                      <small className="font-normal text-zinc-500">
                        {hint}
                      </small>
                    </span>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </button>
                ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                {[
                  ["month", "月份"],
                  ["year", "年度"],
                  ["all", "全部"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    aria-pressed={period === v}
                    onClick={() => setPeriod(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {period === "month" && (
                <TextInput
                  aria-label="月份"
                  type="month"
                  value={month}
                  onChange={(e) => e.target.value && setMonth(e.target.value)}
                />
              )}
              {period === "year" && (
                <TextInput
                  aria-label="年度"
                  type="number"
                  min="1"
                  max="9999"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              )}
              <TextInput
                type="search"
                aria-label="搜备注或金额"
                placeholder="搜备注或金额"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setLimit(30);
                }}
              />
              {book === "expense" && (
                <HorizontalPillTabs
                  tabs={categoryTabs}
                  activeValue={cat}
                  ariaLabel="开支分类"
                  onChange={(v) => {
                    setCat(v);
                    setLimit(30);
                  }}
                />
              )}
            </div>
          )}
          <h2>{page === "home" ? "本月数据" : "筛选结果"}</h2>
          {data?.key !== key ? (
            <p>读取中…</p>
          ) : data.error ? (
            <button onClick={() => setRefresh((v) => v + 1)}>
              读取失败，点击重试
            </button>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-2">
                {stats(shown, book).map(([label, value]) => (
                  <div className="rounded-xl bg-blue-50 p-3" key={label}>
                    <dt className="text-sm">{label}</dt>
                    <dd className="font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
              {page === "view" && shown.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        [
                          bookNames[book] + " " + (prefix || "全部年份"),
                          ...stats(shown, book).map(
                            ([label, value]) => label + " " + value,
                          ),
                        ].join("\n"),
                      );
                      setMessage("已复制汇总");
                    } catch {
                      setMessage("复制失败，请检查浏览器剪贴板权限");
                    }
                  }}
                >
                  复制汇总
                </button>
              )}
              {page === "home" && (
                <h3 className="font-semibold">本月最近三笔</h3>
              )}
              {entries(shown.slice(0, page === "home" ? 3 : limit))}
              {!shown.length && <p>暂无记录</p>}
              {page === "view" && shown.length > limit && (
                <button onClick={() => setLimit(limit + 30)}>显示更多</button>
              )}
            </>
          )}
          {page === "home" && (
            <>
              <p className="text-sm text-zinc-500">
                账目保存在你的 OpenAA 账号中，换设备登录也能查看。
              </p>
              <div>
                {Object.entries(modes).map(([m, l]) => (
                  <button
                    aria-pressed={mode === m}
                    key={m}
                    onClick={() => {
                      const v = m as keyof typeof modes;
                      setMode(v);
                      switchBook(v === "full" ? "expense" : v);
                      document.cookie =
                        "ledger-mode-" +
                        owner +
                        "=" +
                        v +
                        "; Path=/profile/ledger; Max-Age=31536000; SameSite=Lax; Secure";
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
