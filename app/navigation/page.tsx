import Link from "next/link";
import { ExternalLink, Map, Star } from "lucide-react";
import { ChannelSeoCard } from "@/components/posts/ChannelSeoCard";
import { ChannelTabs } from "@/components/posts/ChannelTabs";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "纽约华人常用导航",
  description: "纽约华人常用网站、本地入口、政府服务和生活导航。",
  path: "/navigation",
});

const navigationCards = [
  { title: "政府服务", description: "移民、证件、税务和城市服务入口占位。", tag: "公共服务" },
  { title: "交通出行", description: "MTA、停车、罚单和机场交通入口占位。", tag: "出行" },
  { title: "生活常用", description: "水电网、学校、医疗和社区资源入口占位。", tag: "生活" },
];

export default function NavigationPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-blue-700">
          <Map size={24} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-black leading-tight text-slate-950">纽约华人常用导航</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">常用网站、本地服务入口、政府服务和生活资源的导航壳。</p>
      </section>
      <ChannelTabs tabs={["全部", "政府服务", "交通出行", "生活常用", "学习资源", "社区"]} />
      <Link href="/login?returnTo=/navigation" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
        <Star size={18} aria-hidden="true" />
        我的导航
      </Link>
      <section className="grid gap-3">
        {navigationCards.map((card) => (
          <div key={card.title} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-blue-700">{card.tag}</p>
                <h2 className="mt-1 font-black text-slate-950">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </div>
              <ExternalLink className="shrink-0 text-slate-400" size={18} aria-hidden="true" />
            </div>
          </div>
        ))}
      </section>
      <ChannelSeoCard title="纽约华人生活导航">
        OpenAA 导航页会逐步整理纽约华人常用网站、政府服务、交通出行、学习和生活资源。当前阶段不接真实导航数据，也不做后台管理。
      </ChannelSeoCard>
    </div>
  );
}
