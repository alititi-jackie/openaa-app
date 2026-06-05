"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function AppInstallClient() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const standalone = isStandaloneMode();
    queueMicrotask(() => {
      setIsStandalone(standalone);
      setShowSuccess(standalone);
    });

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowTips(false);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setShowTips(false);
      setShowSuccess(true);
      setShowSuccessModal(true);
      window.localStorage.setItem("openaa:pwa-installed", "1");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (isStandalone) {
      setShowSuccess(true);
      return;
    }

    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      setDeferredPrompt(null);
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        setShowSuccess(true);
        setShowTips(false);
        setShowSuccessModal(true);
        window.localStorage.setItem("openaa:pwa-installed", "1");
      } else {
        setShowTips(true);
      }

      return;
    }

    setShowTips(true);
  }

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-8rem)] items-start justify-center bg-[#f4f7fb] px-4 py-9">
      <main className="w-full max-w-[720px] rounded-[26px] border border-blue-200/60 bg-gradient-to-br from-white to-blue-50 px-4 py-7 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:rounded-[30px] sm:px-5 sm:py-9">
        <Image src="/openaa-logo.png" alt="OpenAA Logo" width={96} height={96} className="mx-auto mb-4 rounded-[26px] bg-white object-contain p-2.5 shadow-[0_12px_26px_rgba(37,99,235,0.18)]" />

        <h1 className="text-[30px] font-black leading-tight tracking-normal text-slate-950 sm:text-[42px]">OpenAA App 下载</h1>
        <p className="mx-auto mt-3 max-w-[560px] text-base leading-7 text-slate-600">把 OpenAA 添加到手机或电脑桌面，可快速进入纽约华人生活入口。</p>

        <div className="mx-auto mt-7 grid max-w-[460px] gap-3">
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isStandalone}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-blue-600 px-4 py-3 text-[17px] font-black text-white shadow-[0_12px_26px_rgba(37,99,235,0.25)] disabled:cursor-default disabled:bg-blue-600"
          >
            {isStandalone ? "已添加 OpenAA" : "添加 OpenAA 到桌面"}
          </button>
          <Link href="/" className="inline-flex min-h-14 w-full items-center justify-center rounded-[18px] border border-blue-200 bg-white px-4 py-3 text-[17px] font-black text-blue-600">
            进入 OpenAA
          </Link>
        </div>

        {showSuccess ? (
          <div className="mx-auto mt-5 max-w-[560px] rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-[15px] leading-7 text-emerald-800">
            OpenAA 已经以桌面 App 方式打开，说明你已经添加过了。
          </div>
        ) : null}

        <p className="mx-auto mt-4 max-w-[560px] text-sm leading-6 text-slate-600">OpenAA app 提供纽约华人招聘、房屋、二手、DMV、新闻、导航和本地服务入口。</p>

        {showTips ? (
          <div className="mx-auto mt-5 max-w-[560px] rounded-[18px] border border-orange-200 bg-orange-50 px-4 py-3 text-left text-[15px] leading-7 text-orange-800">
            <strong className="text-orange-900">当前浏览器不能直接弹出安装窗口，请按下面方法添加：</strong>
            <br />
            <br />
            iPhone：用 Safari 打开本页 → 点分享或共享按钮 → 添加到主屏幕 → 点击右上角“添加”。
            <br />
            Android：用 Chrome 打开本页 → 点右上角菜单 → 安装应用 / 添加到主屏幕。
            <br />
            电脑：用 Chrome 或 Edge 打开本页 → 点地址栏右侧安装图标。
          </div>
        ) : null}
      </main>

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="install-success-title" onClick={() => setShowSuccessModal(false)}>
          <div className="w-full max-w-[420px] rounded-[26px] border border-slate-200 bg-white px-5 py-6 text-center shadow-[0_22px_60px_rgba(15,23,42,0.25)]" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-[34px] font-black text-emerald-600">✓</div>
            <h2 id="install-success-title" className="text-2xl font-black leading-tight text-slate-950">
              OpenAA 已添加到桌面
            </h2>
            <p className="mx-auto mt-3 text-[15px] leading-7 text-slate-600">以后可以从手机或电脑桌面直接打开 OpenAA。也可以现在进入 OpenAA 继续使用。</p>
            <div className="mt-5 grid gap-3">
              <Link href="/" className="inline-flex min-h-12 w-full items-center justify-center rounded-[18px] bg-blue-600 px-4 py-3 text-base font-black text-white">
                打开 OpenAA
              </Link>
              <button type="button" onClick={() => setShowSuccessModal(false)} className="inline-flex min-h-12 w-full items-center justify-center rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-base font-black text-slate-700">
                我知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
