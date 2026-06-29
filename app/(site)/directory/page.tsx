import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Home, LogIn, MapPin, UserPlus } from "lucide-react";
import { canonicalUrl, siteConfig } from "@/lib/seo/siteConfig";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const directoryTitle = "OpenAA 地址电话本";
const directoryDescription = "保存常用英文地址，登录后点击即可打开地图导航。";
const seoDescription =
  "OpenAA 地址电话本帮助在美国生活的华人保存常用英文地址和电话，登录后可快速搜索地址、点击打开地图导航，适合记录机场、车站、公司、学校、医生、仓库和常去地点。";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "OpenAA 地址电话本｜美国常用地址与电话记录工具",
  description: seoDescription,
  alternates: {
    canonical: canonicalUrl("/directory"),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: directoryTitle,
    description: directoryDescription,
    url: canonicalUrl("/directory"),
    siteName: siteConfig.name,
    type: "website",
    locale: siteConfig.locale,
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "OpenAA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: directoryTitle,
    description: directoryDescription,
    images: ["/og-default.png"],
  },
};

export default async function PublicDirectoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const isLoggedIn = Boolean(user);

  return (
    <div className="-mx-4 -mt-4 min-h-[calc(100dvh-8rem)] bg-slate-50 px-4 pb-24 pt-8">
      <main className="mx-auto flex w-full max-w-[640px] flex-col items-center text-center">
        <Image src="/openaa-logo.png" width={72} height={72} alt="OpenAA" priority className="rounded-2xl shadow-sm" />
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black text-blue-700 shadow-sm">
          <MapPin size={14} aria-hidden="true" />
          OpenAA
        </div>
        <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950">{directoryTitle}</h1>
        <p className="mt-3 text-base font-bold leading-7 text-blue-700">{directoryDescription}</p>
        <p className="mt-3 max-w-[520px] text-sm leading-6 text-slate-600">
          适合保存机场、车站、公司、学校、医生、仓库、店铺等常用地址。
        </p>

        <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
          {isLoggedIn ? (
            <DirectoryLink href="/profile/directory" primary icon={<ArrowRight size={18} aria-hidden="true" />}>
              进入地址电话本
            </DirectoryLink>
          ) : (
            <>
              <DirectoryLink href="/login?returnTo=/profile/directory" primary icon={<LogIn size={18} aria-hidden="true" />}>
                登录使用
              </DirectoryLink>
              <DirectoryLink href="/register?returnTo=/profile/directory" icon={<UserPlus size={18} aria-hidden="true" />}>
                注册账号
              </DirectoryLink>
            </>
          )}
          <DirectoryLink href="/" icon={<Home size={18} aria-hidden="true" />} className={isLoggedIn ? "" : "sm:col-span-2"}>
            返回首页
          </DirectoryLink>
        </div>
      </main>
    </div>
  );
}

function DirectoryLink({
  href,
  children,
  icon,
  primary = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  icon: ReactNode;
  primary?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black shadow-sm transition active:scale-[0.98] ${
        primary
          ? "bg-[#1976d2] text-white hover:bg-[#1565c0]"
          : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
      } ${className}`}
    >
      {icon}
      {children}
    </Link>
  );
}
