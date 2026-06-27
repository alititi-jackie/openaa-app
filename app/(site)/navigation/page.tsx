import { ChannelPageChrome } from "@/components/channels/ChannelPageChrome";
import { PublicStatusNotice } from "@/components/common/PublicStatusNotice";
import { NavigationMyCard } from "@/components/navigation/NavigationMyCard";
import { NavigationPublicSections } from "@/components/navigation/NavigationPublicSections";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { getNavigationPageData } from "@/features/navigation/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export const metadata = buildPageMetadata({
  title: "美国华人常用网站导航",
  description: "OpenAA 整理美国华人常用网站、政府服务、银行金融、购物平台、通讯网络、AI 工具和生活服务入口。",
  path: "/navigation",
});

type NavigationPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function NavigationPage({ searchParams }: NavigationPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim() || "";
  const data = await getNavigationPageData({ q });

  return (
    <ChannelPageChrome
      channelKey="navigation"
      path="/navigation"
      title="美国华人常用网站导航"
      description="政府办事、银行金融、购物通讯、AI 工具、视频社交和生活服务常用入口。"
    >
      <h1 className="sr-only">OpenAA Navigation</h1>
      <NavigationMyCard />

      {data.state !== "ready" ? (
        <PublicStatusNotice tone="warning" className="rounded-2xl">
          {data.state === "missing_config" ? "Supabase 环境变量未配置，当前仅显示默认分类和空状态。" : `导航读取暂时不可用：${data.error ?? "请稍后再试。"}`}
        </PublicStatusNotice>
      ) : null}

      <NavigationPublicSections categories={data.categories} links={data.links} />

      <ChannelSeoCard title="纽约华人生活导航">
        <div className="space-y-3">
          <p>
            OpenAA 公共导航面向在美国生活、学习、工作和经营小生意的华人用户，整理美国华人导航、纽约华人导航、华人常用网站和美国生活网站中最常被打开的入口。很多用户每天都会在政府办事、银行金融、购物网站、手机通讯、AI 工具、视频娱乐、社交媒体和华人生活服务之间切换，如果每次都重新搜索，容易遇到广告结果、重复页面或过期链接。这个页面的目标是把高频网站按分类放在同一个位置，方便快速跳转，也方便用户建立自己的常用网站清单。
          </p>
          <p>
            对刚到美国或刚搬到纽约的用户来说，纽约生活信息往往分散在不同平台。办理驾照和车辆业务时需要找 DMV 官网，处理身份、工卡、绿卡或入籍相关事项时会查移民局 USCIS，报税季会频繁访问 IRS 报税和退税查询入口。除此之外，银行开户、信用卡、转账、保险、手机套餐、网络服务、网购平台、外卖配送、地图出行等美国生活网站也会成为日常刚需。OpenAA 导航会优先保留这些常见场景的入口，并用简短说明帮助用户判断链接用途。
          </p>
          <p>
            纽约华人社区的信息需求不只包括官方办事网站，也包括华人求职招聘、房屋租房、二手交易、本地服务和生活交流。找工作时，用户可能需要同时查看 OpenAA 招聘、本地招聘网站和职业平台；找房时会关注房屋租房、合租、转租和社区周边信息；处理闲置物品时会用到二手交易入口；需要装修、搬家、维修、会计、律师、驾校、保险等服务时，也会搜索华人生活服务。把这些入口放在导航页里，可以减少重复搜索，让不同年龄和不同英文水平的用户都能更快找到方向。
          </p>
          <p>
            页面中的链接会按照后台启用的分类和显示数量展示，分类可能覆盖政府服务、银行金融、购物平台、通讯网络、AI 工具、视频娱乐、社交媒体、生活服务和其它常用资源。OpenAA 不承诺第三方网站内容一定准确或持续可用，也不会替用户完成任何官方申请；涉及 DMV、USCIS、IRS、银行金融或法律税务事项时，仍应以对应官方网站和专业意见为准。本页会尽量保持结构清晰、白底轻量、移动端友好，让美国华人用户在手机和电脑上都能快速浏览常用入口。
          </p>
          <ul className="space-y-1 font-bold text-slate-700">
            <li>适合用户：纽约华人、在美华人、新移民、留学生、日常办事和生活查询用户</li>
            <li>核心入口：政府服务、交通出行、银行金融、购物通讯、AI 工具、生活服务和华人常用导航</li>
            <li>使用建议：先按分类筛选常用网站，再把高频入口加入“我的导航”方便下次打开</li>
          </ul>
        </div>
      </ChannelSeoCard>
    </ChannelPageChrome>
  );
}
