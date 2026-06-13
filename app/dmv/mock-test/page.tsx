import { DmvMockTestClient } from "@/components/dmv/DmvMockTestClient";
import { DmvTopActions } from "@/components/dmv/DmvTopActions";
import { getFavoriteState } from "@/features/favorites/queries";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

const title = "DMV 模拟考试";
const description = "纽约 DMV 中文模拟考试，20 题，提交后统一显示结果。";
const path = "/dmv/mock-test";

export const metadata = buildPageMetadata({
  title,
  description,
  path,
  noIndex: true,
});

export default async function DmvMockTestPage() {
  const [bank, initialIsFavorited] = await Promise.all([
    getDmvQuestionBank(),
    getFavoriteState({ type: "dmv", id: "dmv-mock-test", url: path, title: "DMV 模拟考试", category: "DMV" }),
  ]);

  return (
    <div className="space-y-4">
      <DmvTopActions id="dmv-mock-test" path={path} title="DMV 模拟考试" text={description} initialIsFavorited={initialIsFavorited} />
      <DmvMockTestClient questions={bank.questions} />
    </div>
  );
}
