export function PinnedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-black text-amber-700 ring-1 ring-amber-100 ${className}`}>
      置顶
    </span>
  );
}
