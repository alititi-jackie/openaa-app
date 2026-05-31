"use client";

type DraftRestoreBannerProps = {
  visible: boolean;
  onRestore: () => void;
  onClear: () => void;
};

export function DraftRestoreBanner({ visible, onRestore, onClear }: DraftRestoreBannerProps) {
  if (!visible) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
      <p className="font-bold">发现本地草稿</p>
      <p className="mt-1">可以恢复上次未提交的内容，或清除后重新填写。</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onRestore} className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white">
          恢复草稿
        </button>
        <button type="button" onClick={onClear} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900">
          清除
        </button>
      </div>
    </div>
  );
}
