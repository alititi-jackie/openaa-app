"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "openaa.navigation.default";
const SUCCESS_MESSAGE_MS = 1400;

export function NavigationDefaultToggle() {
  const router = useRouter();
  const [defaultMode, setDefaultMode] = useState<"public" | "my">("public");
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDefaultMode(readDefaultMode());
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isMyDefault = defaultMode === "my";

  function showSuccess(nextMode: "public" | "my") {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage("设置成功");
    timeoutRef.current = setTimeout(() => {
      setMessage("");
      if (nextMode === "public") router.push("/navigation");
    }, SUCCESS_MESSAGE_MS);
  }

  function toggleDefault() {
    const nextMode = isMyDefault ? "public" : "my";
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    window.dispatchEvent(new Event("openaa:navigation-default-change"));
    setDefaultMode(nextMode);
    showSuccess(nextMode);
  }

  return (
    <div className="relative">
      {message ? (
        <div className="absolute -top-9 left-0 right-0 rounded-xl border border-blue-100 bg-blue-50 px-2 py-1.5 text-center text-xs font-black text-blue-700 shadow-sm">
          {message}
        </div>
      ) : null}
      <button
        type="button"
        onClick={toggleDefault}
        className="flex min-h-[82px] w-full flex-col items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 px-2 py-3 text-center shadow-sm transition hover:border-blue-200 hover:bg-blue-100 active:scale-[0.99]"
      >
        <span className="whitespace-nowrap text-sm font-black leading-tight text-blue-700">{isMyDefault ? "改回默认" : "设为默认"}</span>
        <span className="mt-1 whitespace-nowrap text-[11px] font-semibold leading-tight text-slate-400">{isMyDefault ? "OpenAA 导航" : "下次打开我的"}</span>
      </button>
    </div>
  );
}

export function readDefaultMode() {
  if (typeof window === "undefined") return "public";
  return window.localStorage.getItem(STORAGE_KEY) === "my" ? "my" : "public";
}
