import Link from "next/link";

type RecycleBinResourceNavProps = {
  active: "post" | "news" | "navigation" | "reports" | "feedback" | "image-cleanup";
};

const tabs = [
  { value: "post", label: "用户发布信息", href: "/admin/recycle-bin?tab=post" },
  { value: "news", label: "新闻", href: "/admin/recycle-bin?tab=news" },
  { value: "navigation", label: "公共导航", href: "/admin/recycle-bin?tab=navigation" },
  { value: "reports", label: "举报", href: "/admin/recycle-bin?tab=reports" },
  { value: "feedback", label: "线索与建议", href: "/admin/recycle-bin?tab=feedback" },
  { value: "image-cleanup", label: "图片清理工具", href: "/admin/image-cleanup" },
] as const;

export function RecycleBinResourceNav({ active }: RecycleBinResourceNavProps) {
  return (
    <nav aria-label="回收站资源分类" className="max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.href}
            className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-black ring-1 ${
              active === tab.value ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
