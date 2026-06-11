import type { ReactNode } from "react";

export type DmvFaqItem = {
  question: ReactNode;
  answer: ReactNode;
};

type DmvFaqSectionProps = {
  items: DmvFaqItem[];
};

type DmvCardProps = {
  children: ReactNode;
};

export function DmvFaqSection({ items }: DmvFaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-slate-950">常见问题 FAQ</h2>
      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <h3 className="text-sm font-bold text-slate-950">{item.question}</h3>
            <div className="mt-1 text-sm leading-6 text-slate-600">{item.answer}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DmvDisclaimerCard({ children }: DmvCardProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 shadow-sm">
      <h2 className="text-base font-black text-amber-950">免责声明</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

export function DmvInfoSection({ children }: DmvCardProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
      <h2 className="text-base font-black text-slate-950">底部说明</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
