import type { ReactNode } from "react";

type DmvProgressBarProps = {
  progress: number;
  barClassName: string;
  children: ReactNode;
  className: string;
  metaClassName: string;
  trackClassName: string;
};

export function DmvProgressBar({ progress, barClassName, children, className, metaClassName, trackClassName }: DmvProgressBarProps) {
  return (
    <section className={className}>
      <div className={trackClassName}>
        <div className={`h-full rounded-full transition-all ${barClassName}`} style={{ width: `${progress}%` }} />
      </div>
      <div className={metaClassName}>{children}</div>
    </section>
  );
}
