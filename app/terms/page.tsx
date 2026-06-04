import { Suspense } from "react";
import { LegalPageActions } from "@/components/legal/LegalPageActions";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "服务条款",
  description: "OpenAA 服务条款，说明平台定位、用户责任、内容规范、交易风险和 DMV 内容边界。",
  path: "/terms",
});

const sections = [
  {
    title: "平台服务",
    body:
      "OpenAA 是面向纽约华人和本地用户的生活信息平台，提供信息发布、展示、搜索、导航、收藏、反馈、DMV 学习参考和社区相关服务。平台帮助用户更方便地找到招聘、房屋、二手、本地服务、新闻、导航和生活工具信息。",
  },
  {
    title: "用户责任",
    body:
      "用户应对自己发布的信息真实性、合法性、完整性、联系方式和后续沟通负责。发布招聘、房屋、二手、本地服务或其它内容时，请确保描述清楚、来源真实，并遵守适用法律和平台规则。",
  },
  {
    title: "交易与线下沟通",
    body:
      "OpenAA 不直接参与用户之间的招聘、雇佣、租赁、买卖、维修、本地服务或其它线下交易关系，也不代表任何一方作出承诺。用户在联系、付款、见面、签约或交付前，应自行核实对方身份、资质、价格、合同和风险。",
  },
  {
    title: "第三方信息",
    body:
      "平台会尽力维护信息秩序，但不保证所有第三方发布的信息绝对真实、准确、及时或适合你的具体需求。用户应结合官方渠道、合同文件、现场情况和专业意见自行判断。",
  },
  {
    title: "禁止内容",
    body:
      "禁止发布虚假、诈骗、侵权、骚扰、歧视、违法、色情、暴力、恶意广告、冒充官方、误导他人或侵犯他人隐私的内容。不得利用平台进行钓鱼、诱导转账、恶意收集信息或其它损害他人权益的行为。",
  },
  {
    title: "平台处理",
    body:
      "如发现违规、风险或用户投诉，OpenAA 可根据情况对相关内容进行隐藏、下架、删除、限制发布、暂停功能、禁用账号或采取其它必要处理。严重违法或安全风险可能会按法律要求配合相关机构处理。",
  },
  {
    title: "DMV 内容说明",
    body:
      "OpenAA 提供的 DMV 题库、练习、流程说明、罚单入口和中文整理仅供学习和办事参考，不代表官方 DMV、法院或政府机构，也不保证与正式考试、政策、费用或办理结果完全一致。正式信息请以官方页面和现场要求为准。",
  },
  {
    title: "条款更新",
    body:
      "OpenAA 可能会根据功能变化、运营需要或法律要求更新本服务条款。更新后的内容会发布在本页面，继续使用平台即表示你知悉并接受更新后的条款。",
  },
];

export default function TermsPage() {
  return (
    <PageShell title="服务条款" description="请在使用 OpenAA 发布、浏览、联系或使用平台工具前阅读以下条款。" eyebrow="Legal">
      <div className="space-y-4 pb-24">
        <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-7 text-slate-600 shadow-sm">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-black text-slate-950">{section.title}</h2>
              <p className="mt-2">{section.body}</p>
            </div>
          ))}
        </section>
        <Suspense>
          <LegalPageActions />
        </Suspense>
      </div>
    </PageShell>
  );
}
