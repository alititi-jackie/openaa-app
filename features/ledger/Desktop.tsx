"use client";
import { useEffect, useState } from "react";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function Desktop() {
  const [event, setEvent] = useState<InstallEvent | null>(null),
    [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      setInstalled(
        display.matches ||
          !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    const finish = () => setInstalled(true);
    update();
    display.addEventListener("change", update);
    window.addEventListener("appinstalled", finish);
    function capture(e: Event) {
      e.preventDefault();
      setEvent(e as InstallEvent);
    }
    window.addEventListener("beforeinstallprompt", capture);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      display.removeEventListener("change", update);
      window.removeEventListener("appinstalled", finish);
    };
  }, []);
  if (installed) return null;
  return (
    <div className="text-sm text-zinc-500">
      把账本添加到桌面，下次点图标就能直接打开，记账更方便。{" "}
      <button
        className="border-0! p-0! font-normal! text-blue-700 underline"
        onClick={async () => {
          if (!event) {
            setHelp(!help);
            return;
          }
          setEvent(null);
          try {
            await event.prompt();
            await event.userChoice;
          } catch {
            setHelp(true);
          }
        }}
      >
        添加到桌面
      </button>
      {help && (
        <p role="status" className="mt-2 text-sm">
          iPhone：用 Safari 打开当前账本，点「分享」→「添加到主屏幕」。Android
          或电脑：打开浏览器菜单，选择「安装应用」或「添加到主屏幕」。
        </p>
      )}
    </div>
  );
}
