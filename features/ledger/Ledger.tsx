"use client";
import { StatusToast, useStatusToast } from "@/components/common/StatusToast";
import { PageShareButton } from "@/components/common/PageShareButton";
import { detailActionButtonClass } from "@/components/common/detailActionStyles";
import { BackButton } from "@/components/common/BackButton";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  CalendarDays,
  Share2,
  ChevronRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HorizontalPillTabs } from "@/components/common/HorizontalPillTabs";
import { TextInput } from "@/components/forms/TextInput";
import { HistoryGroup } from "./HistoryGroup";
import { EntryForm } from "./EntryForm";
import { Desktop } from "./Desktop";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Transfer } from "./Transfer";
import { readPage, writeEntries, type Groups, type PeriodGroup } from "./store";
import {
  categories,
  totalColor,
  kinds,
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
function stats(groups: Groups, book: Book) {
  const g = (book === "summary" ? undefined : groups[book]) ?? {
    amount: 0,
    cny: 0,
    count: 0,
    cash: 0,
    card: 0,
    abs_usd: 0,
    abs_cny: 0,
  };
  if (book === "summary") {
    const [expense, income, remit] = kinds.map((k) => groups[k]?.amount ?? 0);
    return [
      [
        "收入",
        "$" + money(income),
        totalColor("income", Math.round(income * 100) / 100),
      ],
      [
        "开支",
        "$" + money(expense),
        totalColor("expense", Math.round(expense * 100) / 100),
      ],
      [
        "收支结余",
        "$" + money(income - expense),
        totalColor("net", Math.round((income - expense) * 100) / 100),
      ],
      [
        "净汇出美元",
        "$" + money(remit),
        totalColor("net", Math.round(remit * 100) / 100),
      ],
      [
        "汇款后结余",
        "$" + money(income - expense - remit),
        totalColor("net", Math.round((income - expense - remit) * 100) / 100),
      ],
      [
        "折合人民币",
        "¥" + money(groups.remittance?.cny ?? 0),
        totalColor("net", groups.remittance?.cny ?? 0),
      ],
    ];
  }
  if (book === "remittance") {
    const usd = g.abs_usd;
    return [
      [
        "净汇出美元",
        "$" + money(g.amount),
        totalColor("net", Math.round(g.amount * 100) / 100),
      ],
      [
        "折合人民币",
        "¥" + money(groups.remittance?.cny ?? 0),
        totalColor("net", groups.remittance?.cny ?? 0),
      ],
      ["平均汇率", usd ? (g.abs_cny / usd).toFixed(3) : "—"],
      ["笔数", g.count],
    ];
  }
  return [
    [names[book] + "总额", "$" + money(g.amount), totalColor(book, g.amount)],
    ["现金", "$" + money(g.cash)],
    ["银行卡", "$" + money(g.card)],
    ["笔数", g.count],
  ];
}
export function Ledger({
  owner,
  initialMode,
  requestedBook,
}: {
  requestedBook?: string;
  owner: string;
  initialMode: keyof typeof modes;
}) {
  const [working, setWorking] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [mode, setMode] = useState<keyof typeof modes>(initialMode),
    [book, setBook] = useState<Book>(
      initialMode === "full"
        ? requestedBook && Object.hasOwn(bookNames, requestedBook)
          ? (requestedBook as Book)
          : "expense"
        : initialMode,
    ),
    [page, setPage] = useState("home"),
    [original, setOriginal] = useState<Entry>();
  const defaults = {
    period: "month",
    month: today().slice(0, 7),
    year: today().slice(0, 4),
    q: "",
    cat: "all",
  };
  const [filters, setFilters] = useState<
    Partial<Record<Book, typeof defaults>>
  >({});
  const { period, month, year, q, cat } = filters[book] ?? defaults;
  function filterBy(patch: Partial<typeof defaults>) {
    setFilters((old) => ({
      ...old,
      [book]: { ...defaults, ...old[book], ...patch },
    }));
    setLimit(30);
    setManual("");
  }
  const [manual, setManual] = useState("");
  const headerBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const measure = () =>
      headerBox.current?.style.setProperty(
        "--ledger-top",
        header.getBoundingClientRect().height + "px",
      );
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => observer.disconnect();
  }, [mode]);
  const [limit, setLimit] = useState(30),
    [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<{
    key: string;
    rows: Entry[];
    groups: Groups;
    loaded: number;
    years: string[];
    periods: PeriodGroup[];
    error?: string;
  }>();
  const [message, setMessage] = useStatusToast();
  const prefix =
    page === "home" && book !== "summary"
      ? today().slice(0, 7)
      : period === "month"
        ? month
        : period === "year"
          ? year
          : "";
  const search = page === "view" ? q : "";
  const category =
    page === "view" && book === "expense" && cat !== "all" ? cat : null;
  const key = JSON.stringify([
    owner,
    book,
    prefix,
    page,
    refresh,
    search,
    category,
  ]);
  const grouped = page === "view" && period !== "month";
  const offset = page === "home" || data?.key !== key ? 0 : data.rows.length;
  const wanted = page === "home" ? 3 : limit;
  const loaded = data?.key === key ? data.loaded : 0;
  useEffect(() => {
    if (page === "form" || page === "transfer" || loaded >= wanted) return;
    let live = true;
    const timer = setTimeout(
      () => {
        readPage(
          owner,
          book,
          prefix,
          category,
          search,
          offset,
          grouped ? 0 : Math.min(30, wanted - loaded),
        ).then(
          (result) => {
            if (live)
              setData((previous) => ({
                key,
                groups: result.groups,
                years: result.years,
                periods: result.periods,
                loaded:
                  result.rows.length < 30
                    ? wanted
                    : loaded + result.rows.length,
                rows:
                  offset && previous?.key === key
                    ? [...previous.rows, ...result.rows]
                    : result.rows,
              }));
          },
          () => {
            if (live)
              setData({
                key,
                rows: [],
                groups: {},
                years: [],
                periods: [],
                loaded: wanted,
                error: "读取失败，请重试",
              });
          },
        );
      },
      search ? 160 : 0,
    );
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [
    owner,
    book,
    prefix,
    category,
    search,
    offset,
    wanted,
    loaded,
    page,
    key,
    grouped,
  ]);
  const [dirty, setDirty] = useState(false);
  const [ask, setAsk] = useState<{
    title: string;
    body: string;
    confirmLabel: string;
    action: () => Promise<void>;
  } | null>(null);
  const [asking, setAsking] = useState(false);
  const askDialog = useRef<HTMLDialogElement>(null);
  const askCancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!ask || asking || !askDialog.current || askDialog.current.open) return;
    askDialog.current.showModal();
    askCancel.current?.focus({ preventScroll: true });
  }, [ask, asking]);
  async function runAsk() {
    if (!ask) return;
    setAsking(true);
    try {
      await ask.action();
      setAsk(null);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setAsking(false);
    }
  }
  function confirmLeave(action: () => void) {
    setAsk({
      title: "放弃这笔未保存的记录？",
      body: "这笔记录还没有保存，离开后填写的内容会丢失。",
      confirmLabel: "放弃并离开",
      action: async () => action(),
    });
  }
  function leaveForm(destination: string) {
    if (working) return;
    if (!dirty) return open(destination);
    confirmLeave(() => open(destination));
  }
  function open(next: string) {
    setMessage("");
    setDirty(false);
    setPage(next);
    setOriginal(undefined);
    setLimit(30);
    setManual("");
    window.scrollTo(0, 0);
  }
  function switchBook(v: Book) {
    if (!dirty) {
      setBook(v);
      return open("home");
    }
    confirmLeave(() => {
      setBook(v);
      open("home");
    });
  }
  const shown = data?.key === key ? data.rows : [];
  function entries(list: Entry[]) {
    return list.map((r) => (
      <article className="border-t py-3" key={r.kind + r.id}>
        <strong>
          {r.category ??
            (r.kind === "income"
              ? r.method === "cash"
                ? "现金收入"
                : "银行卡收入"
              : r.amount < 0
                ? "汇款冲正"
                : "汇出")}{" "}
          · ${money(r.amount)}
        </strong>
        <div className="text-sm text-zinc-600">
          {r.date} ·{" "}
          {r.kind === "remittance"
            ? "¥" + money(r.cny ?? 0) + " · 汇率 " + r.rate?.toFixed(3)
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
              onClick={() =>
                setAsk({
                  title: "删除这笔记录？",
                  body:
                    r.date +
                    " · " +
                    (r.category ??
                      (r.kind === "income"
                        ? r.method === "cash"
                          ? "现金收入"
                          : "银行卡收入"
                        : r.amount < 0
                          ? "汇款冲正"
                          : "汇出")) +
                    " $" +
                    money(r.amount) +
                    (r.kind === "remittance"
                      ? " · ¥" + money(r.cny ?? 0)
                      : "") +
                    (r.note ? " · " + r.note : ""),
                  confirmLabel: "确认删除",
                  action: async () => {
                    await writeEntries(owner, [
                      { ...r, expected: r.revision, remove: true },
                    ]);
                    setRefresh((v) => v + 1);
                    setMessage("已删除");
                  },
                })
              }
            >
              删除
            </button>
          </>
        )}
      </article>
    ));
  }
  return (
    <>
      <div className="flex items-center justify-between">
        <BackButton
          href={page === "home" ? "/profile" : undefined}
          onBack={() => leaveForm("home")}
          label={page === "home" ? "我的" : "账本首页"}
          className={detailActionButtonClass}
        />
        <PageShareButton
          path="/profile/ledger"
          title="OpenAA 生活收支账本"
          text="登录后打开自己的生活账本"
        />
      </div>
      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm [&_button:not([role])]:cursor-pointer [&_button]:rounded-xl [&_button]:border [&_button]:border-blue-100 [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm [&_button]:font-semibold [&_button[aria-pressed=true]]:bg-blue-600 [&_button[aria-pressed=true]]:text-white [&_h2]:text-lg [&_h2]:font-bold">
        <h1 className="text-2xl font-bold">生活收支账本</h1>
        {mode === "full" && (
          <div
            ref={headerBox}
            className="sticky z-20 bg-white shadow-sm"
            style={{ top: "var(--ledger-top, 0px)" }}
          >
            <HorizontalPillTabs
              disabled={working || savingMode}
              underline
              tabs={Object.entries({ ...bookNames, summary: "汇总" }).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              )}
              activeValue={book}
              ariaLabel="账本"
              onChange={(v) => switchBook(v as Book)}
            />
          </div>
        )}
        {page === "form" && book !== "summary" ? (
          <EntryForm
            onBusy={setWorking}
            owner={owner}
            kind={book}
            original={original}
            onEdit={() => setDirty(true)}
            cancel={() => leaveForm(original ? "view" : "home")}
            done={() => {
              open(original ? "view" : "home");
              setRefresh((v) => v + 1);
              setMessage("已保存");
            }}
          />
        ) : page === "transfer" ? (
          <Transfer
            onBusy={setWorking}
            book={book}
            period={prefix}
            stats={stats}
            owner={owner}
            done={() => setRefresh((v) => v + 1)}
          />
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
            ) : null}
            {(page === "view" || book === "summary") && (
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
                      onClick={() => filterBy({ period: v })}
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
                    onChange={(e) =>
                      e.target.value && filterBy({ month: e.target.value })
                    }
                  />
                )}
                {period === "year" && (
                  <select
                    aria-label="年度"
                    className="min-h-11 w-full rounded-lg border px-3"
                    value={year}
                    onChange={(e) => filterBy({ year: e.target.value })}
                  >
                    {Array.from(
                      new Set([
                        today().slice(0, 4),
                        year,
                        ...(data?.years ?? []),
                      ]),
                    )
                      .sort()
                      .reverse()
                      .map((y) => (
                        <option key={y}>{y}</option>
                      ))}
                  </select>
                )}
                {page === "view" && (
                  <TextInput
                    type="search"
                    aria-label="搜备注或金额"
                    placeholder="搜备注或金额"
                    value={q}
                    onChange={(e) => {
                      filterBy({ q: e.target.value });
                      setLimit(30);
                    }}
                  />
                )}
                {book === "expense" && (
                  <HorizontalPillTabs
                    tabs={categoryTabs}
                    activeValue={cat}
                    ariaLabel="开支分类"
                    onChange={(v) => {
                      filterBy({ cat: v });
                      setLimit(30);
                    }}
                  />
                )}
              </div>
            )}
            <h2>
              {page === "home"
                ? book === "summary"
                  ? (prefix || "全部年份") + " 收支"
                  : "本月数据"
                : "筛选结果"}
            </h2>
            {data?.key !== key ? (
              <p>读取中…</p>
            ) : data.error ? (
              <button onClick={() => setRefresh((v) => v + 1)}>
                读取失败，点击重试
              </button>
            ) : (
              <>
                {(shown.length > 0 ||
                  grouped ||
                  book === "summary" ||
                  page === "view") && (
                  <dl className="grid grid-cols-2 gap-2">
                    {stats(data.groups, book).map(([label, value, color]) => (
                      <div className="rounded-xl bg-blue-50 p-3" key={label}>
                        <dt className="text-sm">{label}</dt>
                        <dd
                          className="font-bold"
                          style={{
                            color:
                              typeof color === "string" ? color : undefined,
                          }}
                        >
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {page === "view" && Object.keys(data.groups).length > 0 && (
                  <button
                    onClick={async () => {
                      const text = [
                        bookNames[book] + " " + (prefix || "全部年份"),
                        ...stats(data.groups, book).map(
                          ([k, v]) => k + " " + v,
                        ),
                      ].join("\n");
                      try {
                        await navigator.clipboard.writeText(text);
                        setMessage("已复制汇总");
                      } catch {
                        setManual(text);
                      }
                    }}
                  >
                    复制汇总
                  </button>
                )}
                {manual && (
                  <textarea
                    aria-label="手动复制汇总"
                    readOnly
                    value={manual}
                    onFocus={(e) => e.target.select()}
                  />
                )}
                {page === "home" && shown.length > 0 && (
                  <h3 className="font-semibold">
                    {book === "summary" ? "所选时段最近三笔" : "本月最近三笔"}
                  </h3>
                )}
                {entries(shown.slice(0, page === "home" ? 3 : limit))}
                {grouped &&
                  data.periods.map((g) => (
                    <HistoryGroup
                      key={key + g.period}
                      owner={owner}
                      book={book}
                      {...g}
                      category={category}
                      search={search}
                      render={entries}
                    />
                  ))}
                {!Object.keys(data.groups).length && (
                  <p>
                    {page === "home" && book !== "summary" ? (
                      <>
                        本月暂无记录，
                        <button onClick={() => open("form")}>去记一笔</button>
                      </>
                    ) : (
                      "这个时段暂无记录"
                    )}
                  </p>
                )}
                {page === "view" &&
                  !grouped &&
                  shown.length <
                    Object.values(data.groups).reduce(
                      (n, g) => n + g.count,
                      0,
                    ) && (
                    <button
                      disabled={loaded < wanted}
                      onClick={() => setLimit(shown.length + 30)}
                    >
                      显示更多
                    </button>
                  )}
              </>
            )}
            {page === "home" && (
              <>
                <aside className="flex gap-3 rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 p-4 text-sm text-amber-950">
                  <ShieldCheck className="shrink-0" size={20} />
                  <div>
                    <strong>数据安全说明</strong>
                    <p>
                      因误操作或系统故障等原因，账目仍有丢失的可能。建议每月导出一次完整
                      Excel 账本，并在批量导入或修改前另存一份。
                    </p>
                  </div>
                </aside>
                <Desktop />
                <p className="text-sm text-zinc-500">
                  切换版本只改变显示内容，其他账目仍会保留。
                </p>
                <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
                  {Object.entries(modes).map(([m, l]) => (
                    <button
                      className="min-w-0 rounded-lg! border-transparent! px-0! text-slate-500 aria-pressed:border-slate-200! aria-pressed:bg-white! aria-pressed:text-slate-700!"
                      aria-pressed={mode === m}
                      key={m}
                      disabled={savingMode}
                      onClick={async () => {
                        const v = m as keyof typeof modes;
                        setSavingMode(true);
                        try {
                          const { error } =
                            await createSupabaseBrowserClient().rpc(
                              "ledger_display_mode",
                              {
                                expected_owner: owner,
                                requested: v,
                                initialize: false,
                              },
                            );
                          if (error) throw error;
                          setMode(v);
                          switchBook(v === "full" ? "expense" : v);
                        } catch {
                          setMessage("版本保存失败，请重试");
                        } finally {
                          setSavingMode(false);
                        }
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
        {ask && (
          <dialog
            ref={askDialog}
            onCancel={(e) => {
              if (asking) e.preventDefault();
            }}
            onClose={() => setAsk(null)}
            aria-labelledby="ledger-ask-title"
            className="fixed inset-0 m-auto w-[min(92vw,28rem)] space-y-4 rounded-2xl bg-white p-5 text-slate-800 shadow-xl backdrop:bg-black/40"
          >
            <h2 id="ledger-ask-title">{ask.title}</h2>
            <p>{ask.body}</p>
            {message && <p role="status">{message}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button
                ref={askCancel}
                type="button"
                disabled={asking}
                className="min-h-11 border-blue-200! bg-blue-50 text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600"
                onClick={() => askDialog.current?.close()}
              >
                取消
              </button>
              <button
                type="button"
                className="min-h-11 border-[#dbb8bd]! bg-[#fff5f5] text-[#992c3a]"
                disabled={asking}
                onClick={() => void runAsk()}
              >
                {ask.confirmLabel}
              </button>
            </div>
          </dialog>
        )}
        <StatusToast toast={message} />
        {page === "home" && (
          <p className="text-sm text-zinc-500">
            账目保存在你的 OpenAA 账号中，换设备登录也能查看。{" "}
            <Link
              className="text-blue-700 underline"
              href={"/profile/ledger/guide?book=" + book}
            >
              使用说明
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
