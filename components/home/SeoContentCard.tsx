type SeoContentCardProps = {
  title?: string;
  content?: string;
  isVisible?: boolean;
};

const defaultTitle = "OpenAA 美国华人生活入口与纽约华人生活信息指南";

const defaultParagraphs = [
  "OpenAA 是面向在美华人的中文生活信息与服务聚合平台，目前重点围绕纽约及周边华人社区建设。很多用户来到美国后，会同时遇到找工作、找房、处理二手物品、寻找本地服务、学习 DMV 规则、查看新闻资讯和保存常用网站入口等需求。OpenAA 希望把这些高频场景集中到一个移动端友好的首页里，让用户打开手机就能快速判断下一步该去哪里，而不是在多个群聊、搜索结果和英文网站之间反复切换。",
  "首页上的招聘、房屋、二手、本地服务、新闻、DMV 和导航入口，对应的是纽约华人生活中最常见的实际问题。求职用户可以先查看最近发布的岗位和兼职信息；租房用户可以快速浏览房源、区域和联系方式；处理闲置物品的用户可以发布或查找二手交易；需要维修、搬家、报税、清洁、接送、会计、法律咨询等服务时，也可以从本地服务频道开始筛选。对于新移民、留学生和第一次在美国办证的用户，DMV 中文练习、交通标志、罚单入口和新手指南可以帮助用户先用中文理解流程，再前往官方渠道核对最新要求。",
  "OpenAA 不只是一个华人导航页面，也不是简单堆放链接的目录。我们更关注信息在手机上的可读性、分类是否清楚、入口是否容易找到、页面是否方便收藏和再次打开。新闻资讯会补充平台公告、本地动态、生活提醒和实用教程；常用导航会整理政府服务、交通出行、办事网站和生活工具；发布类频道会尽量让标题、区域、时间和联系方式更容易比较。随着内容持续增加，首页会成为连接各频道的起点，帮助用户从一个站内完成浏览、搜索、收藏和继续联系。",
  "平台基础信息、新闻资讯、常用导航和 DMV 学习工具会尽量保持免费使用。OpenAA 也欢迎用户推荐实用网站、生活资源、页面问题、合作建议和广告投放需求。涉及政府申请、缴费、考试预约、法律、税务、保险或线下交易时，请以官方机构、专业人士和实际沟通结果为准；OpenAA 的定位是提供中文整理、生活入口和信息连接，帮助在美华人更快找到美国生活所需信息。",
];

const defaultHighlights = [
  "适合用户：纽约华人、在美华人、新移民、留学生、上班族、商家和家庭用户",
  "核心入口：华人招聘、华人租房、二手交易、本地服务、新闻资讯、DMV 中文和常用导航",
  "使用建议：先从首页选择频道，再结合发布时间、区域、分类和详情内容判断是否继续浏览或联系",
];

function countChineseSeoLength(value: string) {
  return value.replace(/\s/g, "").length;
}

function contentToParagraphs(content?: string) {
  const normalized = content?.trim() ?? "";

  if (!normalized || countChineseSeoLength(normalized) < 600) {
    return { title: defaultTitle, paragraphs: defaultParagraphs, highlights: defaultHighlights };
  }

  return {
    title: null,
    paragraphs: normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean),
    highlights: [],
  };
}

export function SeoContentCard({
  title = defaultTitle,
  content,
  isVisible = true,
}: SeoContentCardProps) {
  if (!isVisible) {
    return null;
  }

  const renderedContent = contentToParagraphs(content);
  const renderedTitle = renderedContent.title ?? title;

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">{renderedTitle}</h2>
      <div className="mt-2 text-sm leading-6 text-slate-600">
        <div className="space-y-3">
          {renderedContent.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {renderedContent.highlights.length > 0 ? (
            <ul className="space-y-1 font-bold text-slate-700">
              {renderedContent.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
