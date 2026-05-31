import type { LucideIcon } from "lucide-react";

export function ChannelHero({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-blue-700">
        <Icon size={24} aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-2xl font-black leading-tight text-slate-950">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}
