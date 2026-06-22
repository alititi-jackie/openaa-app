import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-10">
        <section className="w-full max-w-[420px] bg-white text-center">
          <p className="text-sm font-black text-blue-600">404</p>
          <h1 className="mt-3 text-2xl font-black text-slate-950">页面暂时找不到</h1>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>OpenAA 已升级为新版网站，原来的页面可能已经调整、合并或不再使用。</p>
            <p>你可以返回首页，继续查看招聘、房屋、二手、新闻、DMV、导航和本地服务等内容。</p>
          </div>
          <div className="mt-7">
            <Link
              href="/"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              返回 OpenAA 首页
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
