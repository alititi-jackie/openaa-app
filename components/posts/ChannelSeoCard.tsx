import type { ReactNode } from "react";
import { SeoInfoCard } from "@/components/common/SeoInfoCard";

export function ChannelSeoCard({ title, children }: { title: string; children: ReactNode }) {
  return <SeoInfoCard title={title}>{children}</SeoInfoCard>;
}
