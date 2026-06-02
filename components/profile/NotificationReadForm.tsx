"use client";

import { useActionState } from "react";
import { markNotificationRead, type NotificationActionState } from "@/features/notifications/actions";

const initialState: NotificationActionState = { ok: true, message: "" };

export function NotificationReadForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(markNotificationRead, initialState);

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "处理中" : "标记已读"}
      </button>
      {state.message ? <p className={state.ok ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-600"}>{state.message}</p> : null}
    </form>
  );
}
