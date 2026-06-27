import type { ReactNode } from "react";
import { BackToTopButton } from "@/components/BackToTopButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-950">
      <main className="mx-auto min-h-dvh w-full max-w-[1040px] px-4 py-4 pb-10">{children}</main>
      <BackToTopButton />
    </div>
  );
}
