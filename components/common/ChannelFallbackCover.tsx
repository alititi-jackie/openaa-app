import type { PostType } from "@/features/posts/types";

type ChannelFallbackKind = "news" | Extract<PostType, "marketplace" | "service">;

type ChannelFallbackCoverProps = {
  kind: ChannelFallbackKind;
  className?: string;
};

const fallbackLabels: Record<ChannelFallbackKind, string> = {
  news: "OpenAA 资讯",
  marketplace: "OpenAA 二手",
  service: "OpenAA 服务",
};

const fallbackThemes: Record<ChannelFallbackKind, string> = {
  news: "from-sky-100 to-blue-200 text-blue-700",
  marketplace: "from-amber-100 to-orange-200 text-orange-800",
  service: "from-emerald-100 to-teal-200 text-teal-800",
};

export function ChannelFallbackCover({ kind, className }: ChannelFallbackCoverProps) {
  return (
    <div className={`${className ?? ""} flex items-center justify-center bg-gradient-to-br ${fallbackThemes[kind]}`.trim()}>
      <span className="text-sm font-semibold">{fallbackLabels[kind]}</span>
    </div>
  );
}
