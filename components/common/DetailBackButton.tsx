"use client";

import { useRouter } from "next/navigation";
import { detailActionButtonClass } from "./detailActionStyles";

type DetailBackButtonProps = {
  fallbackHref: string;
  label?: string;
  className?: string;
};

export function DetailBackButton({ fallbackHref, label = "返回", className = detailActionButtonClass }: DetailBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    const hasPriorPage = typeof window !== "undefined" && (document.referrer !== "" || window.history.length > 2);
    if (hasPriorPage) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button type="button" onClick={handleBack} className={`z-30 ${className}`}>
      ← {label}
    </button>
  );
}
