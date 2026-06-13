import { DetailBackButton } from "@/components/common/DetailBackButton";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { PageShareButton } from "@/components/common/PageShareButton";

type DmvTopActionsProps = {
  id: string;
  path: string;
  title: string;
  text: string;
  initialIsFavorited: boolean;
};

export function DmvTopActions({ id, path, title, text, initialIsFavorited }: DmvTopActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <DetailBackButton fallbackHref="/dmv" />
      <div className="flex items-center gap-2">
        <FavoriteButton target={{ type: "dmv", id, url: path, title, category: "DMV" }} returnTo={path} initialIsFavorited={initialIsFavorited} />
        <PageShareButton path={path} title={title} text={text} />
      </div>
    </div>
  );
}
