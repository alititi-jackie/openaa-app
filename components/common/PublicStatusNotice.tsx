import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PublicStatusNoticeTone = "info" | "warning" | "error" | "success";

const toneClasses: Record<PublicStatusNoticeTone, string> = {
  info: "border-slate-200 bg-slate-50 text-slate-600",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-100 bg-red-50 text-red-700",
  success: "border-green-100 bg-green-50 text-green-700",
};

type PublicStatusNoticeProps = {
  children: ReactNode;
  tone?: PublicStatusNoticeTone;
  className?: string;
};

export function PublicStatusNotice({ children, tone = "info", className }: PublicStatusNoticeProps) {
  return <div className={cn("rounded-xl border p-4 text-sm leading-6", toneClasses[tone], className)}>{children}</div>;
}
