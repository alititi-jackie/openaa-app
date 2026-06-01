import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { DmvMockTestClient } from "@/components/dmv/DmvMockTestClient";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "DMV 模拟考试",
  description: "纽约 DMV 中文模拟考试，20 题，提交后统一显示结果。",
  path: "/dmv/mock-test",
  noIndex: true,
});

export default async function DmvMockTestPage() {
  const bank = await getDmvQuestionBank();

  return (
    <PageShell title="DMV 模拟考试" description="按纽约 DMV Permit 规则模拟：20 题，至少答对 14 题，交通标志至少答对 2 题。" eyebrow="DMV">
      <Link href="/dmv" className="inline-flex text-sm font-black text-blue-700 underline underline-offset-4">
        返回 DMV 首页
      </Link>
      <DmvMockTestClient questions={bank.questions} />
    </PageShell>
  );
}
