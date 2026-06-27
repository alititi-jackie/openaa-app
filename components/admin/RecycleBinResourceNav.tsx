import { AdminStatusTabs } from "@/components/admin/AdminStatusTabs";

type RecycleBinResourceNavProps = {
  active: "post" | "news" | "navigation" | "ads" | "reports" | "feedback" | "notifications" | "image-cleanup";
};

const tabs = [
  { value: "post", label: "用户发布信息", href: "/admin/recycle-bin?tab=post" },
  { value: "news", label: "新闻", href: "/admin/recycle-bin?tab=news" },
  { value: "navigation", label: "公共导航", href: "/admin/recycle-bin?tab=navigation" },
  { value: "ads", label: "广告", href: "/admin/recycle-bin?tab=ads" },
  { value: "reports", label: "举报", href: "/admin/recycle-bin?tab=reports" },
  { value: "feedback", label: "线索与建议", href: "/admin/recycle-bin?tab=feedback" },
  { value: "notifications", label: "通知", href: "/admin/recycle-bin?tab=notifications" },
  { value: "image-cleanup", label: "图片清理工具", href: "/admin/recycle-bin?tab=image-cleanup" },
] as const;

export function RecycleBinResourceNav({ active }: RecycleBinResourceNavProps) {
  return <AdminStatusTabs tabs={[...tabs]} activeValue={active} ariaLabel="回收站资源分类" variant="dark" />;
}
