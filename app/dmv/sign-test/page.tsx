import { DetailBackButton } from "@/components/common/DetailBackButton";
import { DmvSignTestClient } from "@/components/dmv/DmvSignTestClient";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <DetailBackButton fallbackHref="/dmv" />
      </div>
      <section className="bg-white py-1">
        <h1 className="text-2xl font-black leading-tight text-slate-950">DMV 交通标志专项练习</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">随机练习交通标志题，答题后立即查看正确与否，并把错题保存在本机浏览器。</p>
      </section>
      <DmvSignTestClient questions={bank.questions} />
    </div>
  );
}
