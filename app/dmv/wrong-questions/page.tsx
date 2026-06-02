import Link from "next/link";
import { DmvWrongQuestionsClient } from "@/components/dmv/DmvWrongQuestionsClient";
import { PageShell } from "@/components/layout/PageShell";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "DMV 错题练习",
  description: "纽约 DMV 中文错题练习，本机保存错题并支持重新练习。",
  path: "/dmv/wrong-questions",
  noIndex: true,
});

export default async function DmvWrongQuestionsPage() {
  const bank = await getDmvQuestionBank();

  return (
    <PageShell title="DMV 错题练习" description="练习和模拟考试答错的题目会保存在本机浏览器，可在这里重新练习。" eyebrow="DMV">
      <Link href="/dmv" className="inline-flex text-sm font-black text-blue-700 underline underline-offset-4">
        返回 DMV 首页
      </Link>
      <DmvWrongQuestionsClient questions={bank.questions} />
    </PageShell>
  );
}
