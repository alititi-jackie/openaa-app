import Link from "next/link";
import { ChannelPageChrome } from "@/components/channels/ChannelPageChrome";
import { NavigationModeSwitch } from "@/components/navigation/NavigationModeSwitch";
import { MyNavigationList } from "@/components/navigation/MyNavigationList";
import { getCurrentUserNavigationLinks } from "@/features/navigation/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的导航",
  description: "保存自己的 OpenAA 常用导航链接。",
  path: "/navigation/my",
  noIndex: true,
});

export default async function MyNavigationPage() {
  const data = await getCurrentUserNavigationLinks();

  return (
    <ChannelPageChrome
      channelKey="navigation"
      path="/navigation/my"
      title="我的导航"
      description="保存自己的常用网站，下次打开 OpenAA 更方便。"
    >
      <NavigationModeSwitch active="my" />

      {data.state === "missing_config" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Supabase 环境变量未配置，暂时无法管理我的导航。
        </div>
      ) : null}

      {!data.userId && data.state !== "missing_config" ? <NavigationLoginPrompt /> : null}
      {data.userId ? <MyNavigationList links={data.data} /> : null}
    </ChannelPageChrome>
  );
}

function NavigationLoginPrompt() {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-black text-slate-950">设置我的导航</h1>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
          登录后可以把常用网站保存到“我的导航”，以后打开 OpenAA 就能快速找到，不用每次重新搜索。
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/login?returnTo=%2Fnavigation%2Fmy"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm"
          >
            登录设置我的导航
          </Link>
          <Link
            href="/navigation"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"
          >
            返回 OpenAA 导航
          </Link>
        </div>
      </div>
    </section>
  );
}
