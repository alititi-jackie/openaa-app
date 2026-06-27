import Link from "next/link";

export type AdminCountPillItem = {
  key: string;
  label: string;
  count: number;
  href?: string;
  active?: boolean;
  tone?: "default" | "primary" | "warning" | "danger" | "success";
};

const toneClasses: Record<NonNullable<AdminCountPillItem["tone"]>, string> = {
  default: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
  primary: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
  warning: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
};

const activeClasses = "border-slate-950 bg-slate-950 text-white";

export function AdminCountPillBar({ items, className = "" }: { items: AdminCountPillItem[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <div className={["-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className].filter(Boolean).join(" ")}>
      <div className="flex min-w-max gap-2">
        {items.map((item) => (
          <AdminCountPill key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}

function AdminCountPill({ item }: { item: AdminCountPillItem }) {
  const classes = [
    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-black transition",
    item.active ? activeClasses : toneClasses[item.tone ?? "default"],
  ].join(" ");
  const content = (
    <>
      <span>{item.label}</span>
      <span>{item.count}</span>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={classes}>
        {content}
      </Link>
    );
  }

  return <span className={classes}>{content}</span>;
}
