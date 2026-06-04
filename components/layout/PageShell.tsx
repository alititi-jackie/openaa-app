import type { ReactNode } from "react";
import { PageTitleCard } from "@/components/PageTitleCard";

type PageShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  keepActionsInline?: boolean;
  children?: ReactNode;
};

export function PageShell({ title, description, eyebrow, actions, keepActionsInline, children }: PageShellProps) {
  return (
    <div className="space-y-4">
      <PageTitleCard title={title} description={description} eyebrow={eyebrow} actions={actions} keepActionsInline={keepActionsInline} />
      {children}
    </div>
  );
}
