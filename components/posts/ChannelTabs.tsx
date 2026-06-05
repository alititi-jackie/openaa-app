export function ChannelTabs({ tabs }: { tabs: string[] }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden py-1 [overscroll-behavior-x:contain] [overscroll-behavior-y:contain] [touch-action:pan-x]">
      <div className="inline-flex flex-nowrap rounded-xl bg-gray-100 p-1">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={
              index === 0
                ? "inline-flex min-h-9 shrink-0 items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold leading-none text-gray-900 shadow-sm"
                : "inline-flex min-h-9 shrink-0 items-center rounded-lg px-4 py-2 text-sm font-semibold leading-none text-gray-600 hover:text-gray-900"
            }
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
