import { redirect } from "next/navigation";
import { BackButton } from "@/components/common/BackButton";
import { detailActionButtonClass } from "@/components/common/detailActionStyles";
import { PageShareButton } from "@/components/common/PageShareButton";
import { PublicStatusNotice } from "@/components/common/PublicStatusNotice";
import { DirectoryManager } from "@/components/directory/DirectoryManager";
import { getCurrentUserDirectoryItems } from "@/features/directory/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "地址电话本",
  description: "保存常用英文地址，登录后点击即可打开地图导航。",
  path: "/profile/directory",
  noIndex: true,
});

export default async function ProfileDirectoryPage() {
  const result = await getCurrentUserDirectoryItems();

  if (result.state !== "missing_config" && !result.userId) {
    redirect("/login?returnTo=%2Fprofile%2Fdirectory");
  }

  return (
    <div className="-mx-4 -mt-4 min-h-[calc(100dvh-8rem)] bg-zinc-100 px-4 pb-24 pt-5">
      <div className="mx-auto w-full max-w-[860px] space-y-3">
        <h1 className="sr-only">地址电话本</h1>
        <div className="flex items-center justify-between">
          <BackButton href="/profile" label="返回" className={detailActionButtonClass} />
          <PageShareButton
            path="/directory"
            title="OpenAA 地址电话本"
            text="保存常用英文地址，登录后点击即可打开地图导航。"
            ariaLabel="分享 OpenAA 地址电话本"
          />
        </div>

        {result.state === "missing_config" ? (
          <PublicStatusNotice className="rounded-2xl p-3">Supabase 环境变量尚未配置，当前显示空列表。</PublicStatusNotice>
        ) : null}
        {result.state === "error" ? (
          <PublicStatusNotice tone="error" className="rounded-2xl p-3 font-bold">地址电话本读取失败，请稍后再试。</PublicStatusNotice>
        ) : null}

        {result.userId ? <DirectoryManager phoneItems={result.data.phone} addressItems={result.data.address} /> : null}
      </div>
    </div>
  );
}
