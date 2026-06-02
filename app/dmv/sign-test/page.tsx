import { DmvBackLink } from "@/components/dmv/DmvBackLink";
import { DmvSignTestClient } from "@/components/dmv/DmvSignTestClient";
import { PageShell } from "@/components/layout/PageShell";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "DMV 交通标志专项练习",
  description: "纽约 DMV 中文交通标志专项练习，从 OpenAA 整理练习题中筛选标志题并即时反馈。",
  path: "/dmv/sign-test",
  noIndex: true,
});

export default async function DmvSignTestPage() {
  const bank = await getDmvQuestionBank();

  return (
    <PageShell title="DMV 交通标志专项练习" description="随机练习交通标志题，答题后立即查看正确与否，并把错题保存在本机浏览器。" eyebrow="DMV">
      <DmvBackLink />
      <DmvSignTestClient questions={bank.questions} />
    </PageShell>
  );
}
