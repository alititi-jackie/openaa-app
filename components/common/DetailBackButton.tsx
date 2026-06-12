"use client";

import { useRouter } from "next/navigation";
import { detailActionButtonClass } from "./detailActionStyles";

type DetailBackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function DetailBackButton({ label = "返回", className = detailActionButtonClass }: DetailBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    const hasPriorPage = typeof window !== "undefined" && window.history.length > 1;
    if (hasPriorPage) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button type="button" onClick={handleBack} className={`z-30 ${className}`}>
      ← {label}
    </button>
  );
}
