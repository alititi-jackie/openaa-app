"use client";

export type HomeSectionNavItem = {
  key: string;
  label: string;
};

export function HomeSectionNav({
  items,
  activeKey,
  onSelect,
}: {
  items: HomeSectionNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden px-1 py-1 [overscroll-behavior-x:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = item.key === activeKey;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`inline-flex min-h-8 shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-bold leading-none transition ${
              active ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
