import { DmvPracticeClient } from "@/components/dmv/DmvPracticeClient";
import { DmvTopActions } from "@/components/dmv/DmvTopActions";
import { getFavoriteState } from "@/features/favorites/queries";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

const title = "DMV 练习模式";
const description = "纽约 DMV 中文练习，可选择随机或顺序、题数，并在答题后即时查看解析。";
const path = "/dmv/practice";

export const metadata = buildPageMetadata({
  title,
  description,
  path,
  noIndex: true,
});

export default async function DmvPracticePage() {
  const [bank, initialIsFavorited] = await Promise.all([
    getDmvQuestionBank(),
    getFavoriteState({ type: "dmv", id: "dmv-practice", url: path, title: "DMV 练习", category: "DMV" }),
  ]);

  return (
    <div className="space-y-4">
      <DmvTopActions id="dmv-practice" path={path} title="DMV 练习" text={description} initialIsFavorited={initialIsFavorited} />
      <DmvPracticeClient questions={bank.questions} />
    </div>
  );
}
