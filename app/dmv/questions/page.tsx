import { DmvBackLink } from "@/components/dmv/DmvBackLink";
import { DmvQuestionsBrowser } from "@/components/dmv/DmvQuestionsBrowser";
import { PageShell } from "@/components/layout/PageShell";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "DMV 题库",
  description: "纽约 DMV 中文练习题库、选项、答案和解释。",
  path: "/dmv/questions",
  noIndex: true,
});

export default async function DmvQuestionsPage() {
  const bank = await getDmvQuestionBank();

  return (
    <PageShell title="DMV 题库" description="按分类或关键词查看纽约 DMV 中文练习题，可选择显示答案。" eyebrow="DMV">
      <DmvBackLink />
      <SourceNotice source={bank.source} sourceVersion={bank.sourceVersion} disclaimer={bank.disclaimer} />
      <DmvQuestionsBrowser questions={bank.questions} />
    </PageShell>
  );
}

function SourceNotice({ source, sourceVersion, disclaimer }: { source: string; sourceVersion: string | null; disclaimer: string }) {
  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      <p className="font-bold">{disclaimer}</p>
      <p className="mt-1">
        数据来源：{source === "supabase" ? "Supabase dmv_questions" : "已审计 OpenAA 纽约 DMV 练习题 JSON"}
        {sourceVersion ? `（${sourceVersion}）` : ""}。
      </p>
    </section>
  );
}
