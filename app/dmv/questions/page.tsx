import { Share2 } from "lucide-react";
import { DetailBackButton } from "@/components/common/DetailBackButton";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { PageShareButton } from "@/components/common/PageShareButton";
import { DmvDisclaimerCard, DmvInfoSection } from "@/components/dmv/DmvBottomSections";
import { DmvHorizontalNav } from "@/components/dmv/DmvHorizontalNav";
import { DmvQuestionsBrowser } from "@/components/dmv/DmvQuestionsBrowser";
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
          <FavoriteButton
            target={{ type: "unsupported", message: "DMV 页面收藏暂未接入收藏表，当前不会写入收藏。" }}
            returnTo="/dmv/questions"
          />
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
      <SourceNotice source={bank.source} sourceVersion={bank.sourceVersion} disclaimer={bank.disclaimer} />
      <DmvInfoSection>
        <p>
          OpenAA 将 DMV 中文题库、分类筛选、答案解析和错题练习放在同一入口，方便纽约华人、新移民和留学生按自己的节奏备考。
        </p>
        <p>
          建议先浏览完整题库，熟悉道路规则和交通标志，再进入随机练习、模拟考试和错题复盘。正式考试安排、费用和题目要求请以 New York DMV 官方信息为准。
        </p>
      </DmvInfoSection>
    </div>
  );
}

function SourceNotice({ source, sourceVersion, disclaimer }: { source: string; sourceVersion: string | null; disclaimer: string }) {
  return (
    <DmvDisclaimerCard>
      <p className="font-bold">{disclaimer}</p>
      <p className="mt-1">
        数据来源：{source === "supabase" ? "Supabase dmv_questions" : "已审计 OpenAA 纽约 DMV 练习题 JSON"}
        {sourceVersion ? `（${sourceVersion}）` : ""}。
      </p>
    </DmvDisclaimerCard>
  );
}
