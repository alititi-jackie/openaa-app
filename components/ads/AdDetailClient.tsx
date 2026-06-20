"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, ShieldCheck, Sparkles, TrendingUp, X, ZoomIn } from "lucide-react";

type AdDetail = {
  imageUrl: string;
  slug: string;
  title: string;
  content: string | null;
  contactName: string | null;
  phone: string | null;
  wechat: string | null;
};

export function AdDetailClient({ ad }: { ad: AdDetail }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-[860px] px-4 pb-6 pt-4 md:pb-10">
        <Link href="/" className="mb-4 inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm">
          返回
        </Link>

        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
          <div className="relative bg-zinc-100">
            <button type="button" onClick={() => setLightboxOpen(true)} className="group block w-full" aria-label="点击查看大图">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ad.imageUrl} alt={ad.title} className="h-[240px] w-full object-contain object-center md:h-[340px]" />
              <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn size={12} />
                <span>查看大图</span>
              </div>
            </button>
          </div>

          <div className="px-4 pt-4 md:px-6">
            <h1 className="text-[20px] font-black tracking-tight text-gray-900 md:text-[24px]">{ad.title || ad.slug}</h1>
            <p className="mt-1 text-[12px] text-gray-500 md:text-[13px]">面向北美华人用户的高曝光展示位</p>
          </div>

          <div className="p-4 md:p-6">
            <section>
              <h2 className="text-xl font-bold text-gray-900">广告详情</h2>
              <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                {ad.content ? formatContent(ad.content) : <p className="text-base text-gray-500">暂无详情内容</p>}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-bold text-gray-900">平台优势</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <AdvantageCard icon={<TrendingUp size={16} className="text-blue-600" />} title="精准华人流量" text="更高匹配度，更低获客成本" color="blue" />
                <AdvantageCard icon={<Sparkles size={16} className="text-amber-600" />} title="首页黄金曝光" text="强占注意力，提升点击咨询" color="amber" />
                <AdvantageCard icon={<ShieldCheck size={16} className="text-emerald-600" />} title="品牌信任提升" text="平台背书，降低用户决策成本" color="emerald" />
                <AdvantageCard icon={<MessageCircle size={16} className="text-purple-600" />} title="高效咨询转化" text="按钮直达，缩短沟通路径" color="purple" />
              </div>
            </section>

            <section className="mt-6">
              <ContactInfoCard ad={ad} />
            </section>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-400">提示：此页面为内部广告详情页展示样式（可按商家内容进行更新）。</p>
      </div>

      {lightboxOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" onClick={() => setLightboxOpen(false)}>
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setLightboxOpen(false)} className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-3 py-2 text-sm text-white" aria-label="关闭">
              <X size={14} />
              关闭
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-contain object-center" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatContent(content: string) {
  const parts = content.split(/\n\s*\n/g).map((part) => part.trim()).filter(Boolean);
  return (
    <div className="space-y-3">
      {parts.map((part, index) => (
        <p key={index} className="whitespace-pre-wrap text-base leading-7 text-gray-800">{part}</p>
      ))}
    </div>
  );
}

function AdvantageCard({ icon, title, text, color }: { icon: React.ReactNode; title: string; text: string; color: "blue" | "amber" | "emerald" | "purple" }) {
  const colorClass = {
    blue: "bg-blue-50 ring-blue-100",
    amber: "bg-amber-50 ring-amber-100",
    emerald: "bg-emerald-50 ring-emerald-100",
    purple: "bg-purple-50 ring-purple-100",
  }[color];

  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-zinc-100">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${colorClass}`}>{icon}</div>
      <p className="mt-2 text-[12.5px] font-bold text-zinc-900">{title}</p>
      <p className="mt-1 text-[11px] text-zinc-600">{text}</p>
    </div>
  );
}

function ContactInfoCard({ ad }: { ad: AdDetail }) {
  const hasContact = Boolean(ad.contactName || ad.phone || ad.wechat);
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">联系广告方</h2>
      {hasContact ? (
        <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
          {ad.contactName ? <p><span className="font-bold text-zinc-900">联系人：</span>{ad.contactName}</p> : null}
          {ad.phone ? <p><span className="font-bold text-zinc-900">电话：</span>{ad.phone}</p> : null}
          {ad.wechat ? <p><span className="font-bold text-zinc-900">微信：</span>{ad.wechat}</p> : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">暂无单独联系方式，请查看广告详情内容。</p>
      )}
    </div>
  );
}
