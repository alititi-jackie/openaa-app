"use client";
import { useState } from "react";
import { fingerprint, money, names, type Entry } from "./model";
import { readEntries, writeEntries } from "./store";
type Candidate = {
  entry: Entry;
  label: string;
  checked: boolean;
  review: boolean;
  before?: Entry;
};
export function Transfer({ owner, done }: { owner: string; done: () => void }) {
  const [preview, setPreview] = useState<Candidate[] | null>(null),
    [same, setSame] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
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
      template ? [] : await readEntries(owner),
      template,
    );
    if (share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
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
    const incoming = await parseFile(file),
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
    setPreview(next);
    setSame(skipped);
  }
  return (
    <section className="space-y-3">
      <h2>导入／导出</h2>
      <fieldset disabled={busy} className="flex flex-wrap gap-2">
        <button onClick={() => run(() => output(false))}>
          导出完整账本（Excel）
        </button>
        <button onClick={() => run(() => output(false, true))}>
          分享完整账本
        </button>
        <label>
          导入账本（Excel 或旧 JSON）
          <input
            type="file"
            accept=".xlsx,.json,.backup"
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
                await writeEntries(
                  owner,
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
          <button disabled={busy} onClick={() => setPreview(null)}>
            取消
          </button>
        </div>
      )}
      <button disabled={busy} onClick={() => run(() => output(true))}>
        下载 Excel 记账模板
      </button>
      <p role="status">{busy ? "处理中…" : message}</p>
    </section>
  );
}
