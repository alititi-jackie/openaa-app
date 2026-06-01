import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { DmvPracticeClient } from "@/components/dmv/DmvPracticeClient";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "DMV 练习模式",
  description: "纽约 DMV 中文随机练习，答题后即时显示结果和解释。",
  path: "/dmv/practice",
  noIndex: true,
});

export default async function DmvPracticePage() {
  const bank = await getDmvQuestionBank();

  return (
    <PageShell title="DMV 练习模式" description="随机刷题，选择答案后立即查看正确与否，并把错题保存在本机浏览器。" eyebrow="DMV">
      <Link href="/dmv" className="inline-flex text-sm font-black text-blue-700 underline underline-offset-4">
        返回 DMV 首页
      </Link>
      <DmvPracticeClient questions={bank.questions} />
    </PageShell>
  );
}
