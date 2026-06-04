import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { PageTitleCard } from "@/components/PageTitleCard";

export function ChannelHero({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return <PageTitleCard title={title} description={description} actions={actions} />;
}
