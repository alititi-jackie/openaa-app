import Link from "next/link";
import { Store } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { redirectToAuthRequired } from "@/lib/auth/redirects";
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "商家资料",
  description: "OpenAA 商家资料占位。",
  path: "/profile/business",
  noIndex: true,
});

export default async function BusinessProfilePage() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirectToAuthRequired("/profile/business");
    }
  }

  return (
    <PageShell title="商家资料" description="第一版先在编辑资料页维护基础商家信息，商家认证后续阶段再做。" eyebrow="Profile">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Store size={22} aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          当前阶段只提供基础商家资料字段，不做商家认证、商品发布、服务发布或完整后台管理。
        </p>
        <Link
          href="/profile/edit"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          去编辑资料
        </Link>
      </section>
    </PageShell>
  );
}
