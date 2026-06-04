import Link from "next/link";
import { BackToTopButton } from "@/components/common/BackToTopButton";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "注册协议确认",
  description: "集中阅读 OpenAA 服务条款和隐私政策，并返回注册流程。",
  path: "/legal/consent",
  noIndex: true,
});

type ConsentPageProps = {
  searchParams: Promise<{ returnTo?: string; agreed?: string }>;
};

function safeReturnTo(value: string | undefined) {
  return value === "/register" ? "/register" : "/register";
}

function registerHref(returnTo: string, agreed: "0" | "1") {
  return `${returnTo}?agreed=${agreed}`;
}

const terms = [
  "OpenAA 是纽约生活信息发布、展示、搜索、导航和社区服务平台。",
  "用户需对自己发布的信息真实性、合法性、联系方式和后续沟通负责。",
  "OpenAA 不直接参与招聘、房屋、二手、本地服务等线下交易或雇佣关系。",
  "平台不保证第三方信息绝对真实，用户需要自行判断风险。",
  "禁止发布虚假、诈骗、侵权、骚扰、违法、冒充官方或误导他人的内容。",
  "平台可对违规内容进行隐藏、删除、限制发布、禁用账号等处理。",
  "DMV 内容仅供学习参考，不代表官方 DMV，也不保证与正式考试完全一致。",
];

const privacy = [
  "OpenAA 可能收集邮箱、用户名、头像、联系方式、发布内容、收藏、反馈、设备与安全日志等必要信息。",
  "这些信息用于账号登录、内容发布、联系展示、安全风控、用户体验优化和平台管理。",
  "OpenAA 不出售用户个人隐私。",
  "用户可联系平台申请删除账号或相关数据，部分信息可能因安全、合规或纠纷处理需要保留必要期限。",
  "离开 OpenAA 前往第三方或官方入口后，请按对方规则保护个人信息并核对网站真实性。",
];

export default async function LegalConsentPage({ searchParams }: ConsentPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const currentAgreed = params.agreed === "1" ? "1" : "0";

  return (
    <PageShell title="注册协议确认" description="请阅读服务条款和隐私政策。点击同意后会返回注册页并自动勾选同意框。" eyebrow="Legal">
      <div className="space-y-4 pb-28">
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-950 shadow-sm">
          <p>
            这里用于注册流程集中确认协议。你也可以查看完整的{" "}
            <Link href="/terms?returnTo=/register" className="font-black text-blue-700 underline underline-offset-4">
              服务条款
            </Link>{" "}
            和{" "}
            <Link href="/privacy?returnTo=/register" className="font-black text-blue-700 underline underline-offset-4">
              隐私政策
            </Link>
            。
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-black text-slate-950">服务条款重点</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
              {terms.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <h2 className="text-base font-black text-slate-950">隐私政策重点</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
              {privacy.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="sticky bottom-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:grid-cols-2">
          <Link href={registerHref(returnTo, "1")} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            同意并返回
          </Link>
          <Link
            href={registerHref(returnTo, currentAgreed)}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
          >
            退出返回
          </Link>
        </section>
        <BackToTopButton />
      </div>
    </PageShell>
  );
}
