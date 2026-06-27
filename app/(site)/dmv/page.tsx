import { ChannelPageChrome } from "@/components/channels/ChannelPageChrome";
import { detailActionButtonClass } from "@/components/common/detailActionStyles";
import { DmvHomeClient } from "@/components/dmv/DmvHomeClient";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { DmvStructuredData } from "@/features/dmv/structuredData";
import { getPublishedNewsList } from "@/features/news/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "2026纽约 DMV 中文驾照指南 | Permit笔试模拟・罚单查询・驾照流程 - OpenAA",
  description: "提供纽约州 NY DMV 中文驾照学习服务，包括 Permit 笔试模拟考试、交通标志练习、纽约 DMV 流程教程、罚单查询、新手考驾照指南等。适合纽约华人、新移民与留学生。",
  path: "/dmv",
});

export default async function DmvPage() {
  const [questionBank, dmvGuides] = await Promise.all([
    getDmvQuestionBank(),
    getPublishedNewsList({ categorySlug: "dmv-guide", limit: 4 }),
  ]);

  return (
    <>
      <DmvStructuredData page="home" />
      <ChannelPageChrome
      channelKey="dmv"
      path="/dmv"
      title="2026纽约 DMV 中文驾照指南 | Permit笔试模拟・罚单查询・驾照流程 - OpenAA"
      description="纽约 DMV 笔试、罚单查询、驾照申请与车辆服务入口。"
      topActionButtonClassName={detailActionButtonClass}
    >
      <DmvHomeClient
        questionCount={questionBank.questions.length}
        guides={dmvGuides.data.map((post) => ({ id: post.id, title: post.title, href: post.href }))}
      />
      </ChannelPageChrome>
    </>
  );
}
