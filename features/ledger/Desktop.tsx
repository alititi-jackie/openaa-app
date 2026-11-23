"use client";
import { useEffect, useState } from "react";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function Desktop() {
  const [event, setEvent] = useState<InstallEvent | null>(null),
    [help, setHelp] = useState(false);
  useEffect(() => {
    function capture(e: Event) {
      e.preventDefault();
      setEvent(e as InstallEvent);
    }
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  return (
    <div>
      <button
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
