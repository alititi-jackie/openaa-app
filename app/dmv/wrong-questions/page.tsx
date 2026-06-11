import { DetailBackButton } from "@/components/common/DetailBackButton";
import { DmvHorizontalNav } from "@/components/dmv/DmvHorizontalNav";
import { DmvWrongQuestionsClient } from "@/components/dmv/DmvWrongQuestionsClient";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "DMV 错题练习",
  description: "纽约 DMV 中文错题练习，本机保存错题并支持重新练习。",
  path: "/dmv/wrong-questions",
  noIndex: true,
});

export default async function DmvWrongQuestionsPage() {
  const bank = await getDmvQuestionBank();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <DetailBackButton fallbackHref="/dmv" />
      </div>
      <ChannelHero title="DMV 错题练习" description="练习和模拟考试答错的题目会保存在本机浏览器，可在这里重新练习。" />
      <DmvHorizontalNav activeValue="wrong-questions" />
      <DmvWrongQuestionsClient questions={bank.questions} />
    </div>
  );
}
