import { PostViewTracker } from "./PostViewTracker";
import { relativeTime } from "@/features/posts/display";

export type DetailMetaPill = {
  label: string;
  value: string;
};

type DetailMetaPillsProps = {
  items: DetailMetaPill[];
  postId: string;
  initialViewCount: number;
};

function displayValue(item: DetailMetaPill) {
  if (item.label === "相对时间") {
    return relativeTime(item.value);
  }

  return item.value;
}

function pillClass(index: number) {
  return `rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:px-3 sm:text-sm ${
    index >= 3 ? "text-slate-800" : "text-slate-500"
  }`;
}

export function DetailMetaPills({ items, postId, initialViewCount }: DetailMetaPillsProps) {
  const visibleItems = items.filter((item) => item.value.trim());

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
      {visibleItems.map((item, index) =>
        item.label === "浏览次数" ? (
          <PostViewTracker key={item.label} postId={postId} initialViewCount={initialViewCount} className={pillClass(index)} />
        ) : (
          <span key={`${item.label}-${item.value}`} className={pillClass(index)}>
            {displayValue(item)}
          </span>
        ),
      )}
    </div>
  );
}
