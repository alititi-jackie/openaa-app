import type { ReactNode } from "react";

type MobileContainerProps = {
  children: ReactNode;
};

export function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[560px] bg-white shadow-[0_0_40px_rgba(15,23,42,0.12)] md:max-w-[760px] lg:max-w-[960px] xl:max-w-[1040px]">
      {children}
    </div>
  );
}
