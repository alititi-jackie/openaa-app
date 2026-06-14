import { Share2 } from "lucide-react";
import { DetailBackButton } from "@/components/common/DetailBackButton";
import { PageShareButton } from "@/components/common/PageShareButton";
import { DmvLearningDisclaimerCard, DmvSeoContentSection } from "@/components/dmv/DmvBottomSections";
import { DmvHorizontalNav } from "@/components/dmv/DmvHorizontalNav";
import { DmvQuestionsBrowser } from "@/components/dmv/DmvQuestionsBrowser";
import { dmvSeoContent } from "@/components/dmv/dmvSeoContent";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "纽约 DMV 中文题库与答案解析",
  description: "NY DMV Permit 全量中文题库，覆盖交通标志、道路规则和常见易错点。",
  path: "/dmv/questions",
  noIndex: true,
});

export default async function DmvQuestionsPage() {
  const bank = await getDmvQuestionBank();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <DetailBackButton fallbackHref="/dmv" />
        <div className="flex items-center gap-2">
          <PageShareButton
            path="/dmv/questions"
            title="纽约 DMV 中文题库与答案解析"
            text="NY DMV Permit 全量中文题库，覆盖交通标志、道路规则和常见易错点。"
            label={
              <span className="inline-flex items-center gap-1.5">
                <Share2 size={15} aria-hidden="true" />
                分享
              </span>
            }
          />
        </div>
      </div>
      <ChannelHero
        title="纽约 DMV 中文题库与答案解析"
        description="本页提供 NY DMV Permit 全量中文题库，覆盖交通标志、道路规则和常见易错点，支持按分类学习与答案解析，适合纽约华人系统备考。"
      />
      <DmvHorizontalNav activeValue="questions" />
      <DmvQuestionsBrowser questions={bank.questions} />
      <DmvLearningDisclaimerCard />
      <DmvSeoContentSection {...dmvSeoContent.questions} />
    </div>
  );
}
