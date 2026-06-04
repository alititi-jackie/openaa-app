import { MapPinned } from "lucide-react";
import { MyNavigationForm } from "@/components/navigation/MyNavigationForm";
import { MyNavigationList } from "@/components/navigation/MyNavigationList";
import { ChannelHero } from "@/components/posts/ChannelHero";
import { getCurrentUserNavigationLinks } from "@/features/navigation/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "我的导航",
  description: "管理自己的 OpenAA 常用导航链接。",
  path: "/navigation/my",
  noIndex: true,
});

export default async function MyNavigationPage() {
  const data = await getCurrentUserNavigationLinks();

  if (data.state !== "missing_config" && !data.userId) {
    redirectToAuthRequired("/navigation/my");
  }

  return (
    <div className="space-y-4">
      <ChannelHero title="我的导航" description="保存自己的常用链接。只有登录用户可以管理，服务端按 user_id 限定读写范围。" icon={MapPinned} />

      {data.state === "missing_config" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Supabase 环境变量未配置，暂时无法管理我的导航。
        </div>
      ) : null}

      {data.userId ? (
        <>
          <MyNavigationForm />
          <MyNavigationList links={data.data} />
        </>
      ) : null}
    </div>
  );
}
