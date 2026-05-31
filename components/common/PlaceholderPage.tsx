import { PageShell } from "@/components/layout/PageShell";

type PlaceholderPageProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PlaceholderPage({ title, description, eyebrow = "Phase 1" }: PlaceholderPageProps) {
  return (
    <PageShell title={title} description={description} eyebrow={eyebrow}>
      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
        <p className="text-sm leading-6 text-slate-600">
          这里是 openaa.app 第一阶段占位页面。当前只建立路由、移动端布局、SEO/PWA 基础和后续业务模块入口，不接入真实业务数据。
        </p>
      </section>
    </PageShell>
  );
}
