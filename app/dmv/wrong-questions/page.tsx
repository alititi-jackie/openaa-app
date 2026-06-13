import { DmvHorizontalNav } from "@/components/dmv/DmvHorizontalNav";
import { DmvTopActions } from "@/components/dmv/DmvTopActions";
import { DmvWrongQuestionsClient } from "@/components/dmv/DmvWrongQuestionsClient";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { getFavoriteState } from "@/features/favorites/queries";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

const title = "DMV 错题练习";
const description = "纽约 DMV 中文错题练习，本机保存错题并支持重新练习。";
const path = "/dmv/wrong-questions";

export const metadata = buildPageMetadata({
  title,
  description,
  path,
  noIndex: true,
});

export default async function DmvWrongQuestionsPage() {
  const [bank, initialIsFavorited] = await Promise.all([
    getDmvQuestionBank(),
    getFavoriteState({ type: "dmv", id: "dmv-wrong-questions", url: path, title: "DMV 错题本入口", category: "DMV" }),
  ]);

  return (
    <div className="space-y-4">
      <DmvTopActions id="dmv-wrong-questions" path={path} title="DMV 错题本入口" text={description} initialIsFavorited={initialIsFavorited} />
      <ChannelHero title={title} description="练习和模拟考试答错的题目会保存在本机浏览器，可在这里重新练习。" />
      <DmvHorizontalNav activeValue="wrong-questions" />
      <DmvWrongQuestionsClient questions={bank.questions} />
    </div>
  );
}
