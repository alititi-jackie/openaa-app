import type { LucideIcon } from "lucide-react";
import { PageTitleCard } from "@/components/PageTitleCard";

export function ChannelHero({
  title,
  description,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return <PageTitleCard title={title} description={description} />;
}
