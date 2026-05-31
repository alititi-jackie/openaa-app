import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约招聘",
  description: "纽约华人招聘、求职、兼职和本地工作信息。",
  path: "/jobs",
});

export default function JobsPage() {
  return <PlaceholderPage title="纽约招聘" description="招聘频道占位，后续接入列表、详情、发布、编辑和我的招聘。" />;
}
