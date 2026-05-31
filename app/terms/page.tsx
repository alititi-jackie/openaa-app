import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "用户协议",
  description: "OpenAA 用户协议初版模板。",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PageShell title="用户协议" description="本页面为第一阶段初版模板，正式上线前需要人工审阅。">
      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
        <p>
          使用 OpenAA 即表示你同意遵守本协议、社区规范和适用法律。用户应对自己发布的信息真实性、合法性和后续沟通负责。
        </p>
        <p>
          OpenAA 提供生活信息展示、搜索、发布和导航服务，不参与用户之间的线下交易、雇佣关系、租赁关系或服务履约。
        </p>
        <p>
          平台可对违规内容进行隐藏、删除、限制发布、封禁账号或移交处理。DMV 练习内容仅供学习参考，不代表官方考试题库。
        </p>
      </section>
    </PageShell>
  );
}
