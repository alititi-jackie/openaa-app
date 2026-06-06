"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "openaa.navigation.default";

export function NavigationDefaultToggle() {
  const [defaultMode, setDefaultMode] = useState<"public" | "my">("public");

  useEffect(() => {
    setDefaultMode(readDefaultMode());
  }, []);

  const isMyDefault = defaultMode === "my";
  const label = isMyDefault ? "改回默认" : "设为默认";
  const hint = isMyDefault ? "OpenAA 导航" : "下次打开我的";

  function toggleDefault() {
    const nextMode = isMyDefault ? "public" : "my";
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    window.dispatchEvent(new Event("openaa:navigation-default-change"));
    setDefaultMode(nextMode);
  }

  return (
    <button
      type="button"
      onClick={toggleDefault}
      className="inline-flex min-h-9 w-full shrink-0 flex-col items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-center shadow-sm"
    >
      <span className="text-xs font-black leading-tight text-blue-700">{label}</span>
      <span className="mt-0.5 text-[11px] font-semibold leading-tight text-blue-500">{hint}</span>
    </button>
  );
}

export function readDefaultMode() {
  if (typeof window === "undefined") return "public";
  return window.localStorage.getItem(STORAGE_KEY) === "my" ? "my" : "public";
}
