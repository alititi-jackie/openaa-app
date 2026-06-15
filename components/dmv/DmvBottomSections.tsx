import type { ReactNode } from "react";
import { SeoInfoCard } from "@/components/common/SeoInfoCard";

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

type DmvSeoContentSectionProps = {
  title: string;
  paragraphs: string[];
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

function DmvDisclaimerCard({ children }: DmvCardProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 shadow-sm">
      <h2 className="text-base font-black text-amber-950">免责声明</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

export function DmvLearningDisclaimerCard() {
  return (
    <DmvDisclaimerCard>
      <p>OpenAA 仅提供 DMV 中文整理和学习辅助，不是 New York DMV 或任何政府机构的官方网站。</p>
      <p>题库、练习、模拟考试和交通标志专项内容仅供备考参考；正式考试、费用、预约、证件要求和最新政策，请以 New York DMV 官方信息为准。</p>
    </DmvDisclaimerCard>
  );
}

export function DmvTicketDisclaimerCard() {
  return (
    <DmvDisclaimerCard>
      <p>OpenAA 不提供法律意见，不保存车牌信息，也不直接查询或保存罚单数据。</p>
      <p>罚单金额、状态、期限、申诉和缴费结果，请以政府、法院或官方机构网站显示的信息为准。</p>
    </DmvDisclaimerCard>
  );
}

export function DmvSeoContentSection({ title, paragraphs }: DmvSeoContentSectionProps) {
  return (
    <SeoInfoCard title={title}>
      <div className="space-y-3">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </SeoInfoCard>
  );
}
