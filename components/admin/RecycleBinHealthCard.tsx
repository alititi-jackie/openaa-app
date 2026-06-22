import Link from "next/link";

export function RecycleBinHealthCard({ label, value, href, active }: { label: string; value: number; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-xl p-3 ring-1 transition ${
        active ? "bg-blue-50 text-blue-900 ring-blue-200" : "bg-slate-50 text-slate-950 ring-slate-100 hover:bg-slate-100"
      }`}
    >
      <span className="block text-xs font-bold text-slate-500">{label}</span>
      <span className="mt-1 block text-2xl font-black">{value}</span>
    </Link>
  );
}
