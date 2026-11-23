"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { fingerprint, money, names, type Kind, type Entry } from "./model";
import { readEntries, writeEntries } from "./store";
type Candidate = {
  entry: Entry;
  label: string;
  checked: boolean;
  review: boolean;
  before?: Entry;
};
type Book = Kind | "summary";
const panel = "space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 [&_p]:leading-relaxed [&_p]:text-slate-600";
export function Transfer({
  owner,
  book,
  period,
  stats,
  done,
}: {
  owner: string;
  book: Book;
  period: string;
  stats: (rows: Entry[], book: Book) => (string | number)[][];
  done: () => void;
}) {
  const [preview, setPreview] = useState<Candidate[] | null>(null),
    [same, setSame] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [all, setAll] = useState(false),
    [manual, setManual] = useState(""),
    [included, setIncluded] = useState<Kind[]>([]),
    [missing, setMissing] = useState<Entry[]>([]),
    [undo, setUndo] = useState<string | null>(null),
    [incoming, setIncoming] = useState<Entry[]>([]),
    [clearRows, setClearRows] = useState<Entry[] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelClear = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!clearRows || busy || !dialog.current || dialog.current.open) return;
    dialog.current.showModal();
    cancelClear.current?.focus({ preventScroll: true });
  }, [clearRows, busy]);
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
    readEntries(
      owner,
      all ? "" : period,
      !all && book !== "summary" ? book : undefined,
    ).then(
      (rows) => {
        if (live)
          setSummary({
            key,
            empty: !rows.length,
            text: [
              span + label + "汇总",
              ...stats(rows, all ? "summary" : book).map(
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
  }, [owner, all, book, period, key, label, span, stats]);
  useEffect(() => {
    let live = true;
    createSupabaseBrowserClient()
      .from("ledger_import_undo")
      .select("token")
      .eq("owner_id", owner)
      .maybeSingle()
      .then(({ data }) => {
        if (live) setUndo(data?.token ?? null);
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
    setEpoch((n) => n + 1);
    setPreview(null);
    done();
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function output(template: boolean, share = false) {
    const { workbook } = await import("./files");
    const file = await workbook(
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
    if (share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
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
  async function inspect(file: File) {
    setPreview(null);
    const { parseFile } = await import("./files");
    const { rows: incoming, included } = await parseFile(file),
      old = await readEntries(owner);
    const byId = new Map(old.map((r) => [r.kind + ":" + r.id, r])),
      known = new Set(old.map(fingerprint));
    let skipped = 0;
    const next: Candidate[] = [];
    for (const r of incoming) {
      const current = byId.get(r.kind + ":" + r.id),
        key = fingerprint(r);
      if (current && fingerprint(current) === key) {
        skipped++;
        continue;
      }
      const match = !current && known.has(key);
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
      <fieldset disabled={busy} className="mb-4 flex gap-1 rounded-xl bg-[#e7ecf3] p-1 [&_button]:flex-1 [&_button]:rounded-lg! [&_button]:border-0! [&_button]:text-[#526278] [&_button[aria-pressed=true]]:bg-white! [&_button[aria-pressed=true]]:text-blue-700!">
        {[false, true].map((v) => (
          <button
            key={String(v)}
            aria-pressed={v === all}
            onClick={() => {
              setAll(v);
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
        <fieldset disabled={busy} className="flex flex-wrap gap-2">
          <button onClick={() => run(() => output(false))}>
            下载{label} Excel
          </button>
          <button onClick={() => run(() => output(false, true))}>
            分享{label} Excel
          </button>
        </fieldset>
      </section>
      <details className={panel}>
        <summary className="cursor-pointer font-semibold">导入 Excel</summary>
        <fieldset disabled={busy}>
          <label>
            选择账号版 Excel 明细文件
            <input
              type="file"
              accept=".xlsx"
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
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const title = included.map((k) => names[k]).join("、");
                  if (
                    !confirm(
                      "覆盖全部年份的" +
                        title +
                        "？将移除文件中缺少的 " +
                        missing.length +
                        " 笔，空明细表也会清空对应账本。",
                    )
                  )
                    return;
                  await apply([
                    ...preview.map(({ entry }) => ({
                      ...entry,
                      expected: entry.revision,
                    })),
                    ...missing.map((r) => ({
                      ...r,
                      expected: r.revision,
                      remove: true,
                    })),
                  ]);
                  setMessage("已覆盖导入");
                })
              }
            >
              覆盖文件包含的账本
            </button>
            <button disabled={busy} onClick={() => setPreview(null)}>
              取消
            </button>
          </div>
        )}
        {undo && (
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                if (
                  confirm(
                    "撤销上次导入？后续修改过的记录发生冲突时将停止恢复。",
                  )
                ) {
                  await apply([], undo);
                  setMessage("已撤销上次导入");
                }
              })
            }
          >
            撤销上次导入
          </button>
        )}
      </details>
      <button disabled={busy} onClick={() => run(() => output(true))}>
        下载 Excel 记账模板
      </button>
      {scope !== "summary" && (
        <section className="mt-6 border-t border-slate-200 pt-5">
          <button className="rounded-[9px]! border-[#dbb8bd]! bg-white text-[#992c3a]"
            disabled={busy}
            onClick={() =>
              run(async () =>
                setClearRows(
                  await readEntries(
                    owner,
                    "",
                    scope === "all" ? undefined : scope,
                  ),
                ),
              )
            }
          >
            清空{label}
          </button>
          {clearRows && (
            <dialog ref={dialog} onCancel={(e) => { if (busy) e.preventDefault(); }} onClose={() => setClearRows(null)} aria-labelledby="clear-ledger-title" className="fixed inset-0 m-auto w-[min(92vw,28rem)] space-y-4 rounded-2xl bg-white p-5 text-slate-800 shadow-xl backdrop:bg-black/40">
              <h2 id="clear-ledger-title">清空{label}？</h2>
              <p>
                将删除账号中全部年份的{label}，共 {clearRows.length} 笔。
                {scope === "all" ? (["expense", "income", "remittance"] as Kind[]).map(k => names[k] + " " + clearRows.filter(r => r.kind === k).length + " 笔").join("、") + "。" : "其他账本保留。"}
                清空后无法撤销。建议先下载 Excel 备份，并确认文件已保存。
              </p>
              <button type="button" className="border-0! p-0! font-normal! text-blue-700 underline" disabled={busy} onClick={() => run(() => output(false))}>
                下载 Excel 备份
              </button>
              {message && <p role="status">{message}</p>}
              <div className="grid grid-cols-2 gap-3">
                <button ref={cancelClear} type="button" disabled={busy} className="min-h-11 border-blue-200! bg-blue-50 text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => dialog.current?.close()}>
                  取消
                </button>
                <button type="button"
                className="min-h-11 border-[#dbb8bd]! bg-[#fff5f5] text-[#992c3a]"
                disabled={busy || !clearRows.length}
                onClick={() =>
                  run(async () => {
                    await writeEntries(
                      owner,
                      clearRows.map((r) => ({
                        ...r,
                        expected: r.revision,
                        remove: true,
                      })),
                    );
                    setClearRows(null);
                    setPreview(null);
                    setEpoch((n) => n + 1);
                    done();
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
      <p role="status">{busy ? "处理中…" : message}</p>
    </section>
  );
}
