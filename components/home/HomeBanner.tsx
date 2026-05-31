import Image from "next/image";
import Link from "next/link";

export type HomeBannerItem = {
  title: string;
  description: string;
  href: string;
  imageUrl: string;
};

export function HomeBanner({ item }: { item: HomeBannerItem }) {
  return (
    <Link href={item.href} className="block overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="relative min-h-40">
        <Image src={item.imageUrl} alt={item.title} fill sizes="430px" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-100">OpenAA New York</p>
          <h1 className="mt-1 text-2xl font-black leading-tight">{item.title}</h1>
          <p className="mt-2 text-sm leading-6 text-blue-50">{item.description}</p>
        </div>
      </div>
    </Link>
  );
}
