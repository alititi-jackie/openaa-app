import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "社区规范",
  description: "OpenAA 社区规范初版模板。",
  path: "/community-guidelines",
});

export default function CommunityGuidelinesPage() {
  return (
    <PageShell title="社区规范" description="本页面为第一阶段初版模板，正式上线前需要人工审阅。">
      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
        <p>请发布真实、清晰、与纽约华人生活相关的信息，避免重复刷屏、虚假宣传、诈骗、骚扰、仇恨、暴力或违法内容。</p>
        <p>招聘、房屋、二手和服务信息应包含准确分类、地区、价格或联系方式。涉及安全风险的内容可被平台限制展示或进入审核。</p>
        <p>用户可通过举报入口反馈可疑内容，后台会根据规则处理举报、隐藏违规内容或限制违规账号。</p>
      </section>
    </PageShell>
  );
}
