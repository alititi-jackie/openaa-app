import Link from "next/link";
import { AlertTriangle, Building2, ChevronRight, FileText, Lightbulb, Newspaper, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "联系我们",
  description: "联系 OpenAA，提交广告合作、新闻线索、功能建议、内容举报、账号注销或数据删除请求。",
  path: "/contact",
});

const contactItems = [
  {
    title: "广告合作咨询",
    description: "广告投放、商家合作、品牌展示和本地服务推广需求。",
    href: "/feedback?type=business&source=contact_page",
    icon: Building2,
  },
  {
    title: "提交新闻线索",
    description: "本地新闻、活动信息、社区通知、实用资讯或资源推荐。",
    href: "/feedback?type=news_tip&source=contact_page",
    icon: Newspaper,
  },
  {
    title: "功能建议",
    description: "页面问题、使用体验、功能优化建议或内容补充建议。",
    href: "/feedback?type=feature_suggestion&source=contact_page",
    icon: Lightbulb,
  },
  {
    title: "内容举报",
    description: "虚假信息、联系方式异常、诈骗风险、过期内容或违规内容。",
    href: "/feedback?type=other&source=contact_page",
    icon: AlertTriangle,
  },
];

const privacyItems = [
  {
    title: "账号注销请求",
    description: "请在表单内容中注明“账号注销”，并尽量使用当前账号登录后提交。",
    href: "/feedback?type=other&source=contact_page",
  },
  {
    title: "数据删除请求",
    description: "请说明需要删除的数据范围，例如账号资料、发布内容或联系方式。",
    href: "/feedback?type=other&source=contact_page",
  },
  {
    title: "隐私相关问题",
    description: "如涉及个人信息更正、删除或其它隐私请求，请留下可回复的联系方式。",
    href: "/feedback?type=other&source=contact_page",
  },
];

export default function ContactPage() {
  return (
    <PageShell
      title="联系我们"
      description="你可以通过下方入口提交合作咨询、新闻线索、功能建议、内容举报、账号注销或数据删除请求。"
      eyebrow="Contact"
    >
      <div className="space-y-4 pb-24">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-slate-950">常用联系事项</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {contactItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex min-h-32 flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <ChevronRight size={18} className="mt-1 shrink-0 text-slate-300 transition group-hover:text-blue-500" aria-hidden="true" />
                  </span>
                  <span className="mt-4 block">
                    <span className="block text-sm font-black text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-950">账号与隐私请求</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                账号注销、数据删除和隐私相关问题会进入同一个工单系统。为了核实身份，建议登录后提交，并留下可回复的联系方式。
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {privacyItems.map((item) => (
              <Link key={item.title} href={item.href} className="group flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0">
                  <span className="block text-sm font-black text-slate-900">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{item.description}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-slate-300 transition group-hover:text-blue-500" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-7 text-slate-600 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-700">
              <FileText size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-950">提交后如何处理</h2>
              <p className="mt-1">
                表单提交成功后会生成编号，并进入 OpenAA 后台消息中心。请尽量写清楚问题、相关链接和联系方式，方便管理员核实和回复。
              </p>
              <p className="mt-2">如果是账号注销或数据删除请求，请在内容开头写明请求类型，例如“账号注销请求”或“数据删除请求”。</p>
            </div>
          </div>
        </section>

        <Link
          href="/feedback?type=other&source=contact_page"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          提交其它问题
        </Link>
      </div>
    </PageShell>
  );
}
