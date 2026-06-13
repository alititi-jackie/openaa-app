import { DmvSignTestClient } from "@/components/dmv/DmvSignTestClient";
import { DmvTopActions } from "@/components/dmv/DmvTopActions";
import { getFavoriteState } from "@/features/favorites/queries";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

const title = "DMV 交通标志专项练习";
const description = "纽约 DMV 中文交通标志专项练习，从 OpenAA 整理题库中筛选标志题并即时反馈。";
const path = "/dmv/sign-test";

export const metadata = buildPageMetadata({
  title,
  description,
  path,
  noIndex: true,
});

export default async function DmvSignTestPage() {
  const [bank, initialIsFavorited] = await Promise.all([
    getDmvQuestionBank(),
    getFavoriteState({ type: "dmv", id: "dmv-sign-test", url: path, title: "DMV 交通标志练习", category: "DMV" }),
  ]);

  return (
    <div className="space-y-4">
      <DmvTopActions id="dmv-sign-test" path={path} title="DMV 交通标志练习" text={description} initialIsFavorited={initialIsFavorited} />
      <section className="bg-white py-1">
        <h1 className="text-2xl font-black leading-tight text-slate-950">{title}</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">随机练习交通标志题，答题后立即查看正确与否，并把错题保存在本机浏览器。</p>
      </section>
      <DmvSignTestClient questions={bank.questions} />
    </div>
  );
}
