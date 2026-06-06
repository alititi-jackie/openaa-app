"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { readDefaultMode } from "@/components/navigation/NavigationDefaultToggle";

export function NavigationAwareLink({ className, children }: { className: string; children: ReactNode }) {
  const [href, setHref] = useState("/navigation");

  useEffect(() => {
    function syncHref() {
      setHref(readDefaultMode() === "my" ? "/navigation/my" : "/navigation");
    }

    syncHref();
    window.addEventListener("storage", syncHref);
    window.addEventListener("openaa:navigation-default-change", syncHref);
    return () => {
      window.removeEventListener("storage", syncHref);
      window.removeEventListener("openaa:navigation-default-change", syncHref);
    };
  }, []);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
