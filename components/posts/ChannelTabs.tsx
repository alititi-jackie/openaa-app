export function ChannelTabs({ tabs }: { tabs: string[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          type="button"
          className={
            index === 0
              ? "shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white"
              : "shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700"
          }
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
