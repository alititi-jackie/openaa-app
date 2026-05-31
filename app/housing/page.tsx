import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约房屋",
  description: "纽约租房、求租、房屋转租和生活居住信息。",
  path: "/housing",
});

export default function HousingPage() {
  return <PlaceholderPage title="纽约房屋" description="房屋频道占位，后续接入租房、求租、出售、求购和地图预留。" />;
}
