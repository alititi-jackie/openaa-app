import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { MobileContainer } from "./MobileContainer";
import { SafeAreaSpacer } from "./SafeAreaSpacer";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineNotice } from "@/components/pwa/OfflineNotice";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { getTopQuickLinks } from "@/features/home/queries";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const topQuickLinks = await getTopQuickLinks();

  return (
    <div className="min-h-dvh bg-slate-200 text-slate-950">
      <MobileContainer>
        <Header quickLinks={topQuickLinks} />
        <main className="min-h-[calc(100dvh-8rem)] px-4 pb-28 pt-4">{children}</main>
        <SafeAreaSpacer />
        <BottomNav />
        <ServiceWorkerRegister />
        <InstallPrompt />
        <UpdatePrompt />
        <OfflineNotice />
      </MobileContainer>
    </div>
  );
}
