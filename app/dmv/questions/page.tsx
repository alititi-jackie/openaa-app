import { DmvLearningDisclaimerCard, DmvSeoContentSection } from "@/components/dmv/DmvBottomSections";
import { DmvHorizontalNav } from "@/components/dmv/DmvHorizontalNav";
import { DmvQuestionsBrowser } from "@/components/dmv/DmvQuestionsBrowser";
import { DmvTopActions } from "@/components/dmv/DmvTopActions";
import { dmvSeoContent } from "@/components/dmv/dmvSeoContent";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { getFavoriteState } from "@/features/favorites/queries";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

const title = "纽约 DMV 中文题库与答案解析";
const description = "NY DMV Permit 全量中文题库，覆盖交通标志、道路规则和常见易错点。";
const path = "/dmv/questions";

export const metadata = buildPageMetadata({
  title,
  description,
  path,
  noIndex: true,
});

export default async function DmvQuestionsPage() {
  const [bank, initialIsFavorited] = await Promise.all([
    getDmvQuestionBank(),
    getFavoriteState({ type: "dmv", id: "dmv-questions", url: path, title: "DMV 中文题库", category: "DMV" }),
  ]);

  return (
    <div className="space-y-4">
      <DmvTopActions id="dmv-questions" path={path} title="DMV 中文题库" text={description} initialIsFavorited={initialIsFavorited} />
      <ChannelHero title={title} description="系统查看 NY DMV Permit 中文题库，支持按分类学习与答案解析，适合纽约华人备考。" />
      <DmvHorizontalNav activeValue="questions" />
      <DmvQuestionsBrowser questions={bank.questions} />
      <DmvLearningDisclaimerCard />
      <DmvSeoContentSection {...dmvSeoContent.questions} />
    </div>
  );
}
