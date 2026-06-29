"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useMemo, useState } from "react";
import { deleteDirectoryItem, moveDirectoryItem, type DirectoryActionState } from "@/features/directory/actions";
import type { DirectoryItem, DirectoryItemType } from "@/features/directory/types";
import { cn } from "@/lib/utils/cn";
import { DirectoryForm } from "./DirectoryForm";

const initialState: DirectoryActionState = { ok: true, message: "" };
const directoryDisclaimerText = "电话地址本是 OpenAA 提供的个人便捷记录工具。OpenAA 会尽量保护你的数据安全，但不保证数据一定不会泄漏、丢失、损坏，或因账号、设备、网络、数据库、系统故障等原因无法找回。";
const sensitiveDataWarning = "请不要在这里保存密码、银行卡、证件号码、重要隐私资料，或任何无法承担丢失风险的重要信息。";
const backupWarning = "建议你定期使用“导出”功能保存备份。继续使用即表示你已知晓以上风险。";
const footerDisclaimerText = "电话地址本只是个人便捷记录工具。OpenAA 不保证数据一定不会泄漏、丢失或损坏。请不要保存密码、证件、银行卡等重要隐私资料，并定期使用导出功能备份。";

export function DirectoryManager({ phoneItems, addressItems }: { phoneItems: DirectoryItem[]; addressItems: DirectoryItem[] }) {
  const [activeType, setActiveType] = useState<DirectoryItemType>("phone");
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const hasAnyItems = phoneItems.length + addressItems.length > 0;
  const activeItems = activeType === "phone" ? phoneItems : addressItems;
  const firstId = activeItems[0]?.id ?? null;
  const lastId = activeItems[activeItems.length - 1]?.id ?? null;
  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return activeItems;
    return activeItems.filter((item) => `${item.name} ${item.value}`.toLowerCase().includes(keyword));
  }, [activeItems, search]);
  const labels = activeType === "phone"
    ? { search: "搜索姓名或电话号码", empty: "还没有电话", noResult: "没有找到匹配电话" }
    : { search: "搜索名称或地址", empty: "还没有地址", noResult: "没有找到匹配地址" };

  function switchType(nextType: DirectoryItemType) {
    setActiveType(nextType);
    setAdding(false);
    setManaging(false);
    setEditingId(null);
    setSearch("");
    setExportOpen(false);
    setExportMessage("");
  }

  if (!hasAnyItems && !disclaimerAcknowledged) {
    return <DirectoryDisclaimerGate onContinue={() => setDisclaimerAcknowledged(true)} />;
  }

  return (
    <div className="space-y-3">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="电话地址本分类">
            <TabButton active={activeType === "phone"} onClick={() => switchType("phone")}>
              电话本
            </TabButton>
            <TabButton active={activeType === "address"} onClick={() => switchType("address")}>
              地址
            </TabButton>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setExportOpen((value) => !value);
                  setExportMessage("");
                }}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm"
              >
                导出
              </button>
              {exportOpen ? (
                <div className="absolute right-0 top-12 z-10 w-36 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => void handleExport("download", activeType, activeItems, setExportMessage, setExportOpen)}
                    className="block min-h-10 w-full rounded-xl px-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    保存到本地
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExport("share", activeType, activeItems, setExportMessage, setExportOpen)}
                    className="block min-h-10 w-full rounded-xl px-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    分享
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setManaging((value) => !value);
                setEditingId(null);
                setExportOpen(false);
              }}
              className={cn(
                "inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black shadow-sm",
                managing ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700",
              )}
            >
              {managing ? "完成" : "编辑"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding((value) => !value);
                setEditingId(null);
                setExportOpen(false);
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 shadow-sm"
            >
              新增
            </button>
          </div>
        </div>

        {exportMessage ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">{exportMessage}</p> : null}

        {adding ? <DirectoryForm key={activeType} itemType={activeType} onSaved={() => setAdding(false)} onCancel={() => setAdding(false)} /> : null}

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={labels.search}
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {activeItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-base font-black text-slate-950">{labels.empty}</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm font-bold text-slate-500 shadow-sm">
            {labels.noResult}
          </div>
        ) : (
          <div className={cn("grid gap-2 sm:gap-3", activeType === "phone" ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
            {visibleItems.map((item) => (
              <div key={item.id} className="space-y-2">
                <DirectoryCard
                  item={item}
                  managing={managing}
                  isFirst={item.id === firstId}
                  isLast={item.id === lastId}
                  onEdit={() => {
                    setEditingId((value) => (value === item.id ? null : item.id));
                    setAdding(false);
                  }}
                />
                {editingId === item.id ? <DirectoryForm item={item} itemType={activeType} onSaved={() => setEditingId(null)} onCancel={() => setEditingId(null)} /> : null}
              </div>
            ))}
          </div>
        )}
      </section>
      <DirectoryFooterDisclaimer />
    </div>
  );
}

function DirectoryDisclaimerGate({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="space-y-4 text-sm font-semibold leading-7 text-slate-600">
        <p>{directoryDisclaimerText}</p>
        <p>{sensitiveDataWarning}</p>
        <p>{backupWarning}</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm"
        >
          我知道了，继续使用
        </button>
        <Link
          href="/profile"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
        >
          返回我的页面
        </Link>
      </div>
    </section>
  );
}

function DirectoryFooterDisclaimer() {
  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
      <h2 className="text-base font-bold text-amber-900">使用提醒</h2>
      <p className="mt-1 text-[15px] leading-relaxed text-amber-900/80">{footerDisclaimerText}</p>
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-xl px-4 py-2 text-sm font-black transition",
        active ? "bg-[#1976d2] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}

function DirectoryCard({
  item,
  managing,
  isFirst,
  isLast,
  onEdit,
}: {
  item: DirectoryItem;
  managing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  const content = <DirectoryCardContent item={item} />;

  if (!managing) {
    if (item.itemType === "phone") {
      const href = phoneHref(item.value);
      if (!href) {
        return <div className="block rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">{content}</div>;
      }

      return (
        <a href={href} className="group block rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
          {content}
        </a>
      );
    }

    return (
      <a
        href={googleMapsHref(item.value)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => openAddress(event, item.value)}
        className="group block rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
      {content}
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <MoveForm id={item.id} itemType={item.itemType} direction="up" disabled={isFirst} />
        <MoveForm id={item.id} itemType={item.itemType} direction="down" disabled={isLast} />
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-700"
        >
          ✎ 编辑
        </button>
        <DeleteForm id={item.id} itemType={item.itemType} />
      </div>
    </div>
  );
}

function DirectoryCardContent({ item }: { item: DirectoryItem }) {
  return (
    <div className="min-h-[82px] rounded-xl bg-slate-50/70 p-3">
      <span className="block break-words text-base font-black leading-tight text-slate-950">{item.name}</span>
      <span className={cn("mt-3 block text-xs font-semibold leading-5 text-slate-500", item.itemType === "phone" ? "break-all" : "break-words")}>
        {item.value}
      </span>
      {item.itemType === "address" ? <span className="mt-2 block text-[11px] font-bold text-blue-600">打开导航</span> : null}
    </div>
  );
}

function MoveForm({ id, itemType, direction, disabled }: { id: string; itemType: DirectoryItemType; direction: "up" | "down"; disabled: boolean }) {
  const router = useRouter();

  async function moveAndRefresh(state: DirectoryActionState, formData: FormData) {
    const result = await moveDirectoryItem(state, formData);
    if (result.ok) router.refresh();
    return result;
  }

  const [, formAction, pending] = useActionState(moveAndRefresh, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="item_type" value={itemType} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {direction === "up" ? "↑ 上移" : "↓ 下移"}
      </button>
    </form>
  );
}

function DeleteForm({ id, itemType }: { id: string; itemType: DirectoryItemType }) {
  const router = useRouter();

  async function deleteAndRefresh(state: DirectoryActionState, formData: FormData) {
    const result = await deleteDirectoryItem(state, formData);
    if (result.ok) router.refresh();
    return result;
  }

  const [state, formAction, pending] = useActionState(deleteAndRefresh, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("确认删除这条记录吗？")) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="item_type" value={itemType} />
      <button
        type="submit"
        disabled={pending}
        title={state.message || undefined}
        className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 px-2 py-1.5 text-xs font-black text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        🗑 删除
      </button>
    </form>
  );
}

function phoneHref(value: string) {
  const phone = value.trim().replace(/\s+/g, "");
  return phone ? `tel:${phone}` : null;
}

function googleMapsHref(value: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

function preferredMapHref(value: string) {
  const query = encodeURIComponent(value);
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("android")) return `geo:0,0?q=${query}`;
  if (/iphone|ipad|ipod/.test(userAgent)) return `https://maps.apple.com/?q=${query}`;
  return googleMapsHref(value);
}

function isMobileUserAgent() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function openAddress(event: React.MouseEvent<HTMLAnchorElement>, value: string) {
  const address = value.trim();
  if (!address) return;

  event.preventDefault();
  const href = preferredMapHref(address);

  if (href.startsWith("geo:") || isMobileUserAgent()) {
    window.location.href = href;
    return;
  }

  window.open(href, "_blank", "noopener,noreferrer");
}

async function handleExport(
  mode: "download" | "share",
  itemType: DirectoryItemType,
  items: DirectoryItem[],
  setMessage: (message: string) => void,
  setOpen: (open: boolean) => void,
) {
  setOpen(false);

  if (items.length === 0) {
    setMessage("暂无可导出的内容");
    return;
  }

  const file = itemType === "phone" ? buildPhonebookFile(items) : buildAddressFile(items);

  if (mode === "download") {
    downloadFile(file);
    setMessage("已为你下载文件。");
    return;
  }

  const shareData = { title: file.name, text: exportText(itemType, items) };

  if (!navigator.share) {
    downloadFile(file);
    setMessage("当前浏览器不支持直接分享，已为你下载文件。");
    return;
  }

  try {
    if (canShareFile(file)) {
      await navigator.share({ ...shareData, files: [file] });
      setMessage("已打开系统分享。");
      return;
    }

    await navigator.share(shareData);
    setMessage("已打开系统分享。");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      setMessage("分享已取消。");
      return;
    }

    downloadFile(file);
    setMessage("当前浏览器不支持直接分享，已为你下载文件。");
  }
}

function buildPhonebookFile(items: DirectoryItem[]) {
  const content = items
    .map((item) => [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${escapeVcfValue(item.name)}`,
      `TEL;TYPE=CELL:${escapeVcfValue(item.value)}`,
      "END:VCARD",
    ].join("\r\n"))
    .join("\r\n");

  return new File([`${content}\r\n`], `openaa-phonebook-${todayString()}.vcf`, { type: "text/vcard;charset=utf-8" });
}

function buildAddressFile(items: DirectoryItem[]) {
  const rows = [["名称", "地址"], ...items.map((item) => [item.name, item.value])];
  const content = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
  return new File([`\uFEFF${content}\r\n`], `openaa-addresses-${todayString()}.csv`, { type: "text/csv;charset=utf-8" });
}

function exportText(itemType: DirectoryItemType, items: DirectoryItem[]) {
  const title = itemType === "phone" ? "电话本" : "地址";
  return [
    `OpenAA ${title}`,
    ...items.map((item) => `${item.name}: ${item.value}`),
  ].join("\n");
}

function escapeVcfValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canShareFile(file: File) {
  try {
    return Boolean(navigator.canShare?.({ files: [file] }));
  } catch {
    return false;
  }
}
