import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "联系我们",
  description: "联系 OpenAA 或提交数据删除请求。",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PageShell title="联系我们" description="反馈、账号注销和数据删除请求入口占位。">
      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
        <p>如需反馈问题、举报内容、请求账号注销或提交数据删除请求，请先通过反馈页面提交。后续阶段会接入正式表单和处理状态。</p>
        <p>正式上线前，本页联系方式和处理时限需要人工确认。</p>
      </section>
    </PageShell>
  );
}
