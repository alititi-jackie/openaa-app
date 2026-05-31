import Link from "next/link";
import { ArrowRight, BookmarkPlus } from "lucide-react";

export function NavigationMyCard() {
  return (
    <Link
      href="/navigation/my"
      className="group block rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm">
          <BookmarkPlus size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-slate-950">我的导航</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">登录后保存常用网站和个人快捷入口</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm transition group-hover:bg-blue-700">
          进入
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
