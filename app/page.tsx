import Link from "next/link";
import { homeQuickLinks } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">OpenAA APP Core</p>
        <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950">纽约华人生活信息平台</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Phase 1 已建立移动优先 Web/PWA 核心壳。招聘、房屋、二手、服务、新闻、DMV 和导航模块将在后续阶段接入真实数据。
        </p>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {homeQuickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-2 text-center text-xs font-bold text-slate-700"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-blue-600 shadow-sm">
                  <Icon size={19} aria-hidden="true" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">第一阶段边界</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          当前不连接旧 Supabase，不导入旧用户，不实现支付、聊天、订单、积分、会员或原生 APP 打包。这里先固定平台底座和 AppShell。
        </p>
      </section>
    </div>
  );
}
