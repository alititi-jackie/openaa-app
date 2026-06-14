"use client";

import type { ReactNode } from "react";
import { PageShareButton } from "@/components/common/PageShareButton";

type DetailShareButtonProps = {
  path: string;
  title: string;
  text: string;
  className?: string;
  label?: ReactNode;
};

export function DetailShareButton({ path, title, text, className, label = "分享" }: DetailShareButtonProps) {
  return <PageShareButton path={path} title={title} text={text} className={className} label={label} />;
}
