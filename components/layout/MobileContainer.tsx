import type { ReactNode } from "react";

type MobileContainerProps = {
  children: ReactNode;
};

export function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-white shadow-[0_0_40px_rgba(15,23,42,0.12)]">
      {children}
    </div>
  );
}
