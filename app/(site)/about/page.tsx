import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "关于 OpenAA · 美国华人生活入口",
  description:
    "OpenAA 是面向在美华人的中文生活信息与服务聚合平台，整合 DMV、招聘、房屋、二手、本地服务、新闻资讯和常用网站导航，帮助华人更快找到美国生活所需信息。",
  path: "/about",
});

const services = [
  {
    title: "DMV 与办证",
    body: "整理 DMV 中文练习、模拟考试、交通标志、罚单查询和常见办证入口，帮助用户先了解流程再跳转官方渠道。",
  },
  {
    title: "招聘求职",
    body: "聚合华人招聘、本地岗位、求职信息和社区招聘入口，让求职和招人更容易被看见。",
  },
  {
    title: "房屋租售",
    body: "覆盖华人租房、找房、出租、搬家和居住相关信息，服务纽约华人及周边生活需求。",
  },
  {
    title: "二手闲置",
    body: "方便发布和查看二手交易、闲置转让、本地自取等生活信息，减少重复沟通成本。",
  },
  {
    title: "本地服务",
    body: "连接装修维修、搬家运输、家政清洁、汽车相关和专业服务，方便用户快速找到可联系的服务方。",
  },
  {
    title: "新闻资讯",
    body: "提供本地新闻、新手指南、平台公告和实用生活信息，帮助用户持续了解身边变化。",
  },
  {
    title: "常用导航",
    body: "集中官方入口、华人导航、办事网站和高频工具，减少反复搜索和误入错误网站的时间。",
  },
  {
    title: "新手指南",
    body: "围绕刚到美国的学习、工作、出行、居住和办事场景，整理更容易理解的中文说明。",
  },
];

const reasons = [
  "节省时间：把官方入口、社区信息和实用工具集中到一个手机上随时能打开的平台。",
  "中文友好：页面和内容按在美华人的使用习惯整理，降低理解和检索成本。",
  "手机端好用：优先适配移动端阅读、查找、收藏和跳转，适合日常临时查询。",
  "信息持续更新：招聘、华人租房、DMV 中文、本地服务、新闻资讯和导航内容会持续补充。",
  "社区共享：欢迎用户推荐资源、反馈问题、补充经验，让平台更贴近真实生活场景。",
  "官方入口和实用工具集中：在一个地方找到美国生活信息、办事入口和常用服务。",
];

const faqs = [
  {
    question: "谁适合使用 OpenAA？",
    answer: "在美国学习、工作、生活的华人，新移民、留学生、上班族、商家和家庭用户都适合使用 OpenAA。",
  },
  {
    question: "OpenAA 只服务纽约吗？",
    answer: "目前 OpenAA 重点围绕纽约及周边华人生活场景建设，后续会逐步扩展到更多美国城市和州。",
  },
  {
    question: "OpenAA 收费吗？",
    answer:
      "导航、新闻资讯、DMV 练习和基础生活信息入口会尽量保持免费使用；未来如有广告、推广或增值服务，会与基础功能区分清楚。",
  },
  {
    question: "可以推荐资源或反馈问题吗？",
    answer: "可以。欢迎用户推荐实用网站、生活资源、页面问题、合作建议和广告投放需求。",
  },
];

export default function AboutPage() {
  return (
    <PageShell
      title="关于 OpenAA"
      description="OpenAA · 美国华人生活入口，是一个面向在美华人的中文生活信息与服务聚合平台。"
      eyebrow="About"
    >
      <div className="space-y-4 pb-24">
        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-7 text-slate-600 shadow-sm">
          <p>
            OpenAA 面向在美华人、新移民、留学生、上班族、商家和家庭用户，整合 DMV、招聘、房屋、二手、本地服务、新闻资讯和常用网站导航。
          </p>
          <p>
            我们希望用户在需要查找美国生活信息、官方入口、本地服务或社区资源时，不必在多个平台之间反复切换，而是能更快找到可靠、清楚、适合手机阅读的中文入口。
          </p>
          <p>OpenAA 不只是网址导航，也是一款手机上随时能打开的中文生活工具。</p>
        </section>

        <section className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-7 text-slate-600 shadow-sm">
          <h2 className="text-base font-black text-slate-950">我们的使命</h2>
          <p>
            让在美华人能够快速、便捷地找到所需的生活信息、官方入口和本地服务。无论是刚到美国的新手，还是已经在美国生活多年的用户，OpenAA 都希望成为一个简单、清楚、好用的中文生活工具。
          </p>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-slate-950">核心服务</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {services.map((service) => (
              <div key={service.title} className="py-3 first:pt-0 last:pb-0">
                <h3 className="text-sm font-black text-slate-900">{service.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{service.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-slate-950">为什么选择 OpenAA</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-slate-950">常见问题</h2>
          <div className="mt-3 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">Q：{faq.question}</h3>
                <p className="text-sm leading-6 text-slate-600">A：{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-7 text-slate-600 shadow-sm">
          <h2 className="text-base font-black text-slate-950">我们的愿景</h2>
          <p>
            OpenAA 希望成为在美华人最常用、最容易打开、最实用的中文生活入口。我们会继续完善招聘、房屋、二手、本地服务、DMV、新闻资讯、导航和更多实用工具，让用户少走弯路，更快解决美国生活中的实际问题。
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-7 text-slate-600 shadow-sm">
          <h2 className="text-base font-black text-slate-950">联系方式</h2>
          <p>如果你有资源推荐、页面问题、合作建议或广告投放需求，欢迎联系 OpenAA。</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/contact" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white">
              联系我们
            </Link>
            <Link href="/feedback" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
              提交反馈
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
