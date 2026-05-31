import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约本地服务",
  description: "纽约华人本地服务、商家、生活服务和便民信息。",
  path: "/services",
});

export default function ServicesPage() {
  return <PlaceholderPage title="本地服务" description="本地服务频道占位，后续接入商家基础资料和服务发布。" />;
}
