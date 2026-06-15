import type { ReactNode } from "react";
import { BackToTopButton } from "@/components/BackToTopButton";
import { AppShell } from "@/components/layout/AppShell";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <BackToTopButton />
    </>
  );
}
