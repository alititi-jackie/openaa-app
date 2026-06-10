import { DmvMockTestClient } from "@/components/dmv/DmvMockTestClient";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "DMV 模拟考试",
  description: "纽约 DMV 中文模拟考试：20 题，提交后统一显示结果。",
  path: "/dmv/mock-test",
  noIndex: true,
});

export default async function DmvMockTestPage() {
  const bank = await getDmvQuestionBank();

  return <DmvMockTestClient questions={bank.questions} />;
}
