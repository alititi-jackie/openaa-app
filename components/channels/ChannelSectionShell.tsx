import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function ChannelSectionShell({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("space-y-4", className)}>{children}</section>;
}
