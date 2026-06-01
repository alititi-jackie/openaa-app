"use client";

import Link from "next/link";

export function DmvLoginPrompt() {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
      <p className="font-black">登录 OpenAA 后，未来可同步错题和学习进度。</p>
      <p className="mt-1 text-blue-800">当前版本先保存在本机浏览器，不会写入云端学习记录。</p>
      <Link href="/login?returnTo=/dmv" className="mt-3 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
        登录 / 注册
      </Link>
    </section>
  );
}
