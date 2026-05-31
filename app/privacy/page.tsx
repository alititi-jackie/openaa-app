import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "隐私政策",
  description: "OpenAA 隐私政策初版模板。",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PageShell title="隐私政策" description="本页面为第一阶段初版模板，正式上线前需要人工审阅。">
      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">
        <p>
          OpenAA 会在提供账号、发布、收藏、反馈、DMV 练习和后台运营功能时收集必要信息，例如账号邮箱、资料信息、用户提交内容、设备与安全日志。
        </p>
        <p>
          我们只会在实现平台功能、保障安全、处理举报和改进体验的合理范围内使用数据。不会把 service role key 或敏感后台权限暴露给前端。
        </p>
        <p>
          用户可在后续账号设置中请求注销账号或删除数据。涉及法律、合规和历史审计记录的数据，可能按适用要求保留必要期限。
        </p>
      </section>
    </PageShell>
  );
}
