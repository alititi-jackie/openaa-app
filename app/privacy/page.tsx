import { Suspense } from "react";
import { LegalPageActions } from "@/components/legal/LegalPageActions";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "隐私政策",
  description: "OpenAA 隐私政策，说明平台可能收集的信息、使用目的、隐私保护和数据删除请求方式。",
  path: "/privacy",
});

const sections = [
  {
    title: "我们可能收集的信息",
    body:
      "为了提供账号、发布、收藏、反馈、安全和平台管理功能，OpenAA 可能收集你主动提供或使用服务时产生的必要信息，包括邮箱、用户名、头像、联系方式、发布内容、收藏记录、反馈内容、设备信息、登录状态和安全日志等。",
  },
  {
    title: "信息使用目的",
    body:
      "这些信息主要用于账号登录和验证、内容发布和展示、联系信息展示、用户体验优化、垃圾信息和诈骗风险防控、处理举报和反馈、维护平台安全以及进行必要的平台运营管理。",
  },
  {
    title: "公开展示的信息",
    body:
      "当你发布招聘、房屋、二手、本地服务或其它公开内容时，内容描述、图片、联系方式、位置区域、发布时间和你选择展示的资料可能会向其他用户公开。请不要在公开内容中填写不希望被他人看到的个人敏感信息。",
  },
  {
    title: "我们不出售个人隐私",
    body:
      "OpenAA 不出售用户个人隐私。除非获得你的授权、为完成你主动发起的功能、符合法律要求，或为保护用户和平台安全所必需，我们不会把你的个人信息用于与平台服务无关的出售行为。",
  },
  {
    title: "第三方与官方入口",
    body:
      "OpenAA 可能提供政府网站、DMV、法院、地图、支付、招聘、新闻或其它第三方入口。你离开 OpenAA 后，在第三方网站提交的信息将受对方隐私政策和服务规则约束，请在填写资料或付款前自行核对网站真实性。",
  },
  {
    title: "账号和数据删除",
    body:
      "用户可以联系 OpenAA 申请删除账号或相关数据。我们会在合理范围内处理请求；但涉及安全、纠纷、合规、备份、审计或法律要求的信息，可能需要按必要期限保留或做限制处理。",
  },
  {
    title: "安全提醒",
    body:
      "请妥善保管账号、邮箱和密码，不要在公开内容中发布身份证件、银行卡、完整住址或其它高敏感信息。如发现可疑联系、诈骗、冒充官方或账号异常，请及时停止沟通并向平台反馈。",
  },
  {
    title: "政策更新",
    body:
      "OpenAA 可能会根据功能变化、运营需要或法律要求更新本隐私政策。更新后的内容会发布在本页面，继续使用平台即表示你知悉更新后的政策。",
  },
];

export default function PrivacyPage() {
  return (
    <PageShell title="隐私政策" description="本政策说明 OpenAA 如何在提供服务时收集、使用和保护必要信息。" eyebrow="Legal">
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
