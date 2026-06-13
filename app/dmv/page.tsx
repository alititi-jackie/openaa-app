import { ChannelPageChrome } from "@/components/channels/ChannelPageChrome";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { detailActionButtonClass } from "@/components/common/detailActionStyles";
import { DmvHomeClient } from "@/components/dmv/DmvHomeClient";
import { getFavoriteState } from "@/features/favorites/queries";
import { getDmvQuestionBank } from "@/features/dmv/questions";
import { getPublishedNewsList } from "@/features/news/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

const dmvTitle = "2026 纽约 DMV 中文驾照指南";
const dmvDescription = "纽约 DMV 笔试、罚单查询、驾照申请与车辆服务入口。";
const favoriteTarget = {
  type: "dmv" as const,
  id: "dmv-home",
  url: "/dmv",
  title: "DMV 工具中心",
  category: "DMV",
};

export const metadata = buildPageMetadata({
  title: `${dmvTitle} | Permit 笔试模拟、罚单查询、驾照流程 - OpenAA`,
  description: "提供纽约州 NY DMV 中文驾照学习服务，包括 Permit 笔试模拟考试、交通标志练习、纽约 DMV 流程教程、罚单查询、新手考驾照指南等。",
  path: "/dmv",
});

export default async function DmvPage() {
  const [questionBank, dmvGuides, initialIsFavorited] = await Promise.all([
    getDmvQuestionBank(),
    getPublishedNewsList({ categorySlug: "dmv-guide", limit: 4 }),
    getFavoriteState(favoriteTarget),
  ]);

  return (
    <ChannelPageChrome
      channelKey="dmv"
      path="/dmv"
      title={dmvTitle}
      description={dmvDescription}
      topActionFavorite={<FavoriteButton target={favoriteTarget} returnTo="/dmv" initialIsFavorited={initialIsFavorited} />}
      topActionButtonClassName={detailActionButtonClass}
    >
      <DmvHomeClient
        questionCount={questionBank.questions.length}
        guides={dmvGuides.data.map((post) => ({ id: post.id, title: post.title, href: post.href }))}
      />
    </ChannelPageChrome>
  );
}
