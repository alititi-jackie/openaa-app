"use client";
import { StatusToast, useStatusToast } from "@/components/common/StatusToast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import {
  matchTemplateRows,
  fingerprint,
  money,
  names,
  type Kind,
  type Entry,
} from "./model";
import { readEntries, readPage, type Groups } from "./store";
type Candidate = {
  entry: Entry;
  label: string;
  checked: boolean;
  review: boolean;
  before?: Entry;
};
type Book = Kind | "summary";
const panel =
  "space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 [&_p]:leading-relaxed [&_p]:text-slate-600";
export function Transfer({
  owner,
  onBusy,
  book,
  period,
  stats,
  done,
}: {
  onBusy: (busy: boolean) => void;
  owner: string;
  book: Book;
  period: string;
  stats: (groups: Groups, book: Book) => (string | number)[][];
  done: () => void;
}) {
  const [preview, setPreview] = useState<Candidate[] | null>(null),
    [same, setSame] = useState(0),
    [busy, setBusy] = useState(false);
  const [message, setMessage] = useStatusToast();
  const [all, setAll] = useState(false),
    [manual, setManual] = useState(""),
    [included, setIncluded] = useState<Kind[]>([]),
    [missing, setMissing] = useState<Entry[]>([]),
    [undoMap, setUndoMap] = useState<Partial<Record<Kind, string>>>({}),
    [incoming, setIncoming] = useState<Entry[]>([]),
    [clearRows, setClearRows] = useState<Entry[] | null>(null);
  const [partial, setPartial] = useState(false);
  const [volumes, setVolumes] = useState<File[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelClear = useRef<HTMLButtonElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!notice || !noticeDialog.current || noticeDialog.current.open) return;
    noticeDialog.current.showModal();
  }, [notice]);
  useEffect(() => {
    if (!clearRows || busy || !dialog.current || dialog.current.open) return;
    dialog.current.showModal();
    cancelClear.current?.focus({ preventScroll: true });
  }, [clearRows, busy]);
  const [ask, setAsk] = useState<{
    title: string;
    body: string;
    confirmLabel: string;
    action: () => Promise<void>;
  } | null>(null);
  const askDialog = useRef<HTMLDialogElement>(null);
  const askCancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!ask || busy || !askDialog.current || askDialog.current.open) return;
    askDialog.current.showModal();
    askCancel.current?.focus({ preventScroll: true });
  }, [ask, busy]);
  const [summary, setSummary] = useState<{
      key: string;
      text: string;
      empty: boolean;
    }>(),
    [epoch, setEpoch] = useState(0);
  const scope = all ? "all" : book,
    current = book === "summary" ? "收支总览" : names[book] + "记录",
    label = all ? "全部记录" : current;
  const key = [scope, period, epoch].join("|"),
    span = all ? "全部年份" : period || "全部年份";
  useEffect(() => {
    let live = true;
    readPage(
      owner,
      all ? "summary" : book,
      all ? "" : period,
      null,
      "",
      0,
      0,
    ).then(
      ({ groups }) => {
        if (live)
          setSummary({
            key,
            empty: !Object.keys(groups).length,
            text: [
              span + label + "汇总",
              ...stats(groups, all ? "summary" : book).map(
                ([k, v]) => k + "　" + v,
              ),
            ].join("\n"),
          });
      },
      () => {
        if (live) setMessage("读取汇总失败");
      },
    );
    return () => {
      live = false;
    };
  }, [owner, all, book, period, key, label, span, stats, setMessage]);
  useEffect(() => {
    let live = true;
    createSupabaseBrowserClient()
      .from("ledger_book_undo")
      .select("kind, token")
      .eq("owner_id", owner)
      .then(({ data }) => {
        if (!live) return;
        const map: Partial<Record<Kind, string>> = {};
        for (const row of (data ?? []) as { kind: Kind; token: string }[])
          map[row.kind] = row.token;
        setUndoMap(map);
      });
    return () => {
      live = false;
    };
  }, [owner, epoch]);
  async function apply(
    changes: (Entry & { expected?: string; remove?: boolean })[],
    token: string | null = null,
  ) {
    const { error } = await createSupabaseBrowserClient().rpc(
      "apply_ledger_import",
      { expected_owner: owner, changes, undo_token: token },
    );
    if (error) throw Error(error.message);
    setVolumes([]);
    setEpoch((n) => n + 1);
    setPreview(null);
    done();
  }
  async function commitScope(
    books: Kind[],
    revisions: string[],
    changes: unknown[],
    clearing: boolean,
  ) {
    const { error } = await createSupabaseBrowserClient().rpc(
      "commit_ledger_scope",
      {
        expected_owner: owner,
        books,
        seen: revisions,
        changes,
        clearing,
      },
    );
    if (error) throw Error(error.message);
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    onBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  async function output(template: boolean, share = false) {
    const { backupFiles } = await import("./files");
    const files = await backupFiles(
      template
        ? []
        : await readEntries(
            owner,
            "",
            scope === "all" || scope === "summary" ? undefined : scope,
          ),
      template,
      template ? "all" : scope,
    );
    setVolumes(files.length > 1 ? files : []);
    if (files.length > 1) {
      setMessage("备份已分卷，请逐个保存，恢复时逐个合并导入。");
      return;
    }
    await deliver(files[0], share, template ? "Excel 记账模板" : label);
  }
  async function deliver(file: File, share: boolean, title: string) {
    if (share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title, files: [file] });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(file),
      a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    setMessage("已开始下载");
  }
  function volumeButtons() {
    return (
      volumes.length > 0 && (
        <div className="space-y-2">
          <p>共 {volumes.length} 卷，请逐个保存，恢复时逐个合并导入。</p>
          {volumes.map((file, i) => (
            <div key={file.name} className="grid grid-cols-2 gap-2">
              <button
                disabled={busy}
                onClick={() => run(() => deliver(file, false, label))}
              >
                下载第 {i + 1} 卷
              </button>
              <button
                disabled={busy}
                onClick={() => run(() => deliver(file, true, label))}
              >
                分享第 {i + 1} 卷
              </button>
            </div>
          ))}
        </div>
      )
    );
  }
  async function inspect(file: File) {
    setPreview(null);
    const { parseFile } = await import("./files");
    const {
        rows: incoming,
        included,
        blankIds,
        partial,
      } = await parseFile(file),
      old = await readEntries(owner);
    const byId = new Map(old.map((r) => [r.kind + ":" + r.id, r])),
      known = new Set(old.map(fingerprint));
    matchTemplateRows(incoming, old, blankIds);
    setPartial(partial);
    setSeen(
      old.filter((r) => included.includes(r.kind)).map((r) => r.revision!),
    );
    let skipped = 0;
    const next: Candidate[] = [];
    for (const r of incoming) {
      const current = byId.get(r.kind + ":" + r.id),
        key = fingerprint(r);
      if (current && fingerprint(current) === key) {
        skipped++;
        continue;
      }
      const match = !current && !blankIds.has(r.id) && known.has(key);
      next.push({
        entry: { ...r, revision: current?.revision },
        before: current,
        label: current
          ? r.revision && r.revision !== current.revision
            ? "已有更新，核对后修改"
            : "修改旧账"
          : match
            ? "相似记录，确认新增"
            : "新增",
        checked: !current && !match,
        review: !!current || match,
      });
      known.add(key);
    }
    const ids = new Set(incoming.map((r) => r.kind + ":" + r.id));
    setMissing(
      old.filter(
        (r) => included.includes(r.kind) && !ids.has(r.kind + ":" + r.id),
      ),
    );
    setIncluded(included);
    setIncoming(incoming);
    setPreview(next);
    setSame(skipped);
  }
  return (
    <section className="space-y-3">
      <h2>{current}导出／分享</h2>
      <aside className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 p-3 text-amber-800">
        <strong>数据保存说明</strong>
        <p>账目保存在账号中。建议定期选择「全部记录」下载完整 Excel 备份。</p>
      </aside>
      <fieldset
        disabled={busy}
        className="mb-4 flex gap-1 rounded-xl bg-[#e7ecf3] p-1 [&_button]:flex-1 [&_button]:rounded-lg! [&_button]:border-0! [&_button]:text-[#526278] [&_button[aria-pressed=true]]:bg-white! [&_button[aria-pressed=true]]:text-blue-700!"
      >
        {[false, true].map((v) => (
          <button
            key={String(v)}
            aria-pressed={v === all}
            onClick={() => {
              setAll(v);
              setVolumes([]);
              setManual("");
              setClearRows(null);
            }}
          >
            {v ? "全部记录" : current}
          </button>
        ))}
      </fieldset>
      <section className={panel}>
        <h2>汇总文字</h2>
        {summary?.key !== key ? (
          <p>正在读取汇总…</p>
        ) : summary.empty ? (
          <p>{span}暂无记录。</p>
        ) : (
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(summary.text);
                setMessage("已复制汇总");
              } catch {
                setManual(summary.text);
              }
            }}
          >
            复制{span}
            {label}汇总
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
      </section>
      <section className={panel}>
        <h2>Excel 表格</h2>
        <p>
          {scope === "summary"
            ? "全部年份的收支总览，仅供查看。"
            : "包含" + label + "的全部年份明细和统计。"}{" "}
        </p>
        <fieldset disabled={busy} className="grid min-w-0 grid-cols-2 gap-2">
          <button onClick={() => run(() => output(false))}>下载{label}</button>
          <button onClick={() => run(() => output(false, true))}>
            分享{label}
          </button>
        </fieldset>
        {volumeButtons()}
        <p className="text-sm text-slate-600">
          分享菜单找不到微信？可先下载
          Excel，在微信聊天中点「＋」→「文件」，选择已下载的表格发送。
        </p>
      </section>
      <section className={panel}>
        <h2>Excel 记账模板</h2>
        <p>
          空白模板，第一张表是填写说明。在 Excel
          里填好后，回到这里展开「导入 Excel」，选择填好的文件即可导入。
        </p>
        <fieldset
          aria-label="Excel 记账模板"
          disabled={busy}
          className="grid min-w-0 grid-cols-2 gap-2"
        >
          <button onClick={() => run(() => output(true))}>下载记账模板</button>
          <button onClick={() => run(() => output(true, true))}>
            分享记账模板
          </button>
        </fieldset>
      </section>
      <details className={panel}>
        <summary className="cursor-pointer text-lg font-bold">导入 Excel</summary>
        <fieldset disabled={busy}>
          <label className="block">
            <span className="font-semibold">选择账号版 Excel 明细文件</span>
            <input
              type="file"
              accept=".xlsx"
              className="mt-1.5 block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-sm file:font-medium"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void run(() => inspect(file));
              }}
            />
          </label>
        </fieldset>
        {preview && (
          <div>
            <p>
              新增 {preview.filter((x) => !x.review).length} 笔，已有 {same}{" "}
              笔，需核对 {preview.filter((x) => x.review).length} 笔。
            </p>
            <p>
              {included
                .map(
                  (k) =>
                    names[k] +
                    " " +
                    incoming.filter((r) => r.kind === k).length +
                    " 笔",
                )
                .join("、")}
            </p>
            {preview.map(
              (x, i) =>
                x.review && (
                  <label className="block" key={i}>
                    <input
                      type="checkbox"
                      checked={x.checked}
                      disabled={busy}
                      onChange={() =>
                        setPreview(
                          preview.map((v, j) =>
                            i === j ? { ...v, checked: !v.checked } : v,
                          ),
                        )
                      }
                    />{" "}
                    {x.label} · {names[x.entry.kind]} · {x.entry.date} ·{" "}
                    {x.before && (
                      <span>
                        原 {money(x.before.amount)} {x.before.category}{" "}
                        {x.before.method} {x.before.note} {x.before.cny}{" "}
                        {x.before.rate} →{" "}
                      </span>
                    )}
                    {money(x.entry.amount)} {x.entry.category} {x.entry.method}{" "}
                    {x.entry.note} {x.entry.cny} {x.entry.rate}
                  </label>
                ),
            )}
            <button
              disabled={busy || !preview.some((x) => x.checked)}
              onClick={() =>
                run(async () => {
                  await apply(
                    preview
                      .filter((x) => x.checked)
                      .map(({ entry }) => ({
                        ...entry,
                        expected: entry.revision,
                      })),
                  );
                  setPreview(null);
                  setMessage("已完成导入");
                  done();
                })
              }
            >
              确认导入选中的记录
            </button>{" "}
            <button
              disabled={busy || partial}
              onClick={() => {
                const title = included.map((k) => names[k]).join("、");
                setAsk({
                  title: "覆盖全部年份的" + title + "？",
                  body:
                    "将移除文件中缺少的 " +
                    missing.length +
                    " 笔，空明细表也会清空对应账本。",
                  confirmLabel: "确认覆盖",
                  action: async () => {
                    await commitScope(
                      included,
                      seen,
                      [
                        ...preview.map(({ entry }) => ({
                          ...entry,
                          expected: entry.revision,
                        })),
                        ...missing.map((r) => ({
                          ...r,
                          expected: r.revision,
                          remove: true,
                        })),
                      ],
                      false,
                    );
                    setEpoch((n) => n + 1);
                    setPreview(null);
                    done();
                    setVolumes([]);
                    setMessage("已覆盖导入");
                  },
                });
              }}
            >
              {partial ? "分卷备份请使用合并导入" : "覆盖文件包含的账本"}
            </button>
            <button disabled={busy} onClick={() => setPreview(null)}>
              取消
            </button>
          </div>
        )}
        {(["expense", "income", "remittance"] as Kind[]).some(
          (k) => undoMap[k],
        ) && (
          <div className="flex flex-wrap gap-2">
            {(["expense", "income", "remittance"] as Kind[])
              .filter((k) => undoMap[k])
              .map((k) => (
                <button
                  key={k}
                  disabled={busy}
                  onClick={() =>
                    setAsk({
                      title: "恢复" + names[k] + "导入前的记录？",
                      body:
                        "将把" +
                        names[k] +
                        "账本恢复到上次导入前的状态，其他账本不受影响。导入后修改过的记录发生冲突时将停止恢复。",
                      confirmLabel: "确认恢复",
                      action: async () => {
                        const { error } =
                          await createSupabaseBrowserClient().rpc(
                            "restore_ledger_book",
                            {
                              expected_owner: owner,
                              book: k,
                              undo_token: undoMap[k],
                            },
                          );
                        if (error) throw Error(error.message);
                        setEpoch((n) => n + 1);
                        done();
                        setMessage("已恢复" + names[k] + "导入前的记录");
                      },
                    })
                  }
                >
                  恢复{names[k]}导入前的记录
                </button>
              ))}
          </div>
        )}
      </details>
      {scope !== "summary" && (
        <section className="mt-6 border-t border-slate-200 pt-5">
          <button
            className="rounded-[9px]! border-[#dbb8bd]! bg-white text-[#992c3a]"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const rows = await readEntries(
                  owner,
                  "",
                  scope === "all" ? undefined : scope,
                );
                if (!rows.length) {
                  setNotice("暂无" + label);
                  return;
                }
                setClearRows(rows);
              })
            }
          >
            清空{label}
          </button>
          {clearRows && (
            <dialog
              ref={dialog}
              onCancel={(e) => {
                if (busy) e.preventDefault();
              }}
              onClose={() => setClearRows(null)}
              aria-labelledby="clear-ledger-title"
              className="fixed inset-0 m-auto w-[min(92vw,28rem)] space-y-4 rounded-2xl bg-white p-5 text-slate-800 shadow-xl backdrop:bg-black/40"
            >
              <h2 id="clear-ledger-title">清空{label}？</h2>
              <p>
                将删除账号中全部年份的{label}，共 {clearRows.length} 笔。
                {scope === "all"
                  ? (["expense", "income", "remittance"] as Kind[])
                      .map(
                        (k) =>
                          names[k] +
                          " " +
                          clearRows.filter((r) => r.kind === k).length +
                          " 笔",
                      )
                      .join("、") + "。"
                  : "其他账本保留。"}
                清空后无法撤销。建议先下载 Excel 备份，并确认文件已保存。
              </p>
              <button
                type="button"
                className="border-0! p-0! font-normal! text-blue-700 underline"
                disabled={busy}
                onClick={() => run(() => output(false))}
              >
                下载备份
              </button>
              {volumeButtons()}
              {message && <p role="status">{message}</p>}
              <div className="grid grid-cols-2 gap-3">
                <button
                  ref={cancelClear}
                  type="button"
                  disabled={busy}
                  className="min-h-11 border-blue-200! bg-blue-50 text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600"
                  onClick={() => dialog.current?.close()}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="min-h-11 border-[#dbb8bd]! bg-[#fff5f5] text-[#992c3a]"
                  disabled={busy || !clearRows.length}
                  onClick={() =>
                    run(async () => {
                      await commitScope(
                        scope === "all"
                          ? ["expense", "income", "remittance"]
                          : [scope],
                        clearRows.map((r) => r.revision!),
                        [],
                        true,
                      );
                      setClearRows(null);
                      setPreview(null);
                      setEpoch((n) => n + 1);
                      done();
                      setVolumes([]);
                      setMessage("已清空");
                    })
                  }
                >
                  确认清空
                </button>
              </div>
            </dialog>
          )}
        </section>
      )}
      {notice && (
        <dialog
          ref={noticeDialog}
          onClose={() => setNotice(null)}
          aria-labelledby="transfer-notice-title"
          className="fixed inset-0 m-auto w-[min(92vw,28rem)] space-y-4 rounded-2xl bg-white p-5 text-slate-800 shadow-xl backdrop:bg-black/40"
        >
          <h2 id="transfer-notice-title">{notice}</h2>
          <p>当前没有任何记录，无需清空。</p>
          <button
            type="button"
            className="min-h-11 w-full border-blue-200! bg-blue-50 text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600"
            onClick={() => noticeDialog.current?.close()}
          >
            知道了
          </button>
        </dialog>
      )}
      {ask && (
        <dialog
          ref={askDialog}
          onCancel={(e) => {
            if (busy) e.preventDefault();
          }}
          onClose={() => setAsk(null)}
          aria-labelledby="transfer-ask-title"
          className="fixed inset-0 m-auto w-[min(92vw,28rem)] space-y-4 rounded-2xl bg-white p-5 text-slate-800 shadow-xl backdrop:bg-black/40"
        >
          <h2 id="transfer-ask-title">{ask.title}</h2>
          <p>{ask.body}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              ref={askCancel}
              type="button"
              disabled={busy}
              className="min-h-11 border-blue-200! bg-blue-50 text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600"
              onClick={() => askDialog.current?.close()}
            >
              取消
            </button>
            <button
              type="button"
              className="min-h-11 border-[#dbb8bd]! bg-[#fff5f5] text-[#992c3a]"
              disabled={busy}
              onClick={() => {
                const current = ask;
                setAsk(null);
                if (current) void run(current.action);
              }}
            >
              {ask.confirmLabel}
            </button>
          </div>
        </dialog>
      )}
      {busy && <p role="status">处理中…</p>}
      {!clearRows && <StatusToast toast={message} />}
    </section>
  );
}
