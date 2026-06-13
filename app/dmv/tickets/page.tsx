import TicketsClient from "@/components/dmv/tickets/TicketsClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约罚单查询指南 | 停车罚单・超速罚单・红灯罚单查询 - OpenAA",
  description:
    "提供纽约停车罚单、超速罚单、红灯摄像头罚单查询教程与官方入口，帮助纽约华人快速找到 DMV、NYC Finance、法院和过路费相关官方入口。",
  path: "/dmv/tickets",
});

export default function DmvTicketsPage() {
  return <TicketsClient />;
}
