"use client";

import { useActionState } from "react";
import { manageOwnPostStatus, type ManagePostActionState } from "@/features/posts/actions";
import type { PostStatus } from "@/features/posts/types";

const initialState: ManagePostActionState = { ok: true, message: "" };

export function UserHousingManagementActions({ postId, status }: { postId: string; status?: PostStatus }) {
  const [state, formAction, pending] = useActionState(manageOwnPostStatus, initialState);
  const canHide = status === "published";
  const canPublish = status === "hidden" || status === "draft" || status === "expired";
  const canDelete = status !== "deleted";

  if (!canHide && !canPublish && !canDelete) return null;

  return (
    <form
      action={formAction}
      className="mt-3 space-y-2"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "hide" && !window.confirm("确认隐藏此房屋信息？")) event.preventDefault();
        if (submitter?.value === "delete" && !window.confirm("确认删除此房屋信息？")) event.preventDefault();
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <div className="flex flex-wrap items-center gap-2">
        {canHide ? <ActionButton action="hide" label="隐藏" disabled={pending} styleName="amber" /> : null}
        {canPublish ? <ActionButton action="publish" label="恢复显示" disabled={pending} styleName="emerald" /> : null}
        {canDelete ? <ActionButton action="delete" label="删除" disabled={pending} styleName="red" /> : null}
      </div>
      {state.message ? <p className={state.ok ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-600"}>{state.message}</p> : null}
    </form>
  );
}

function ActionButton({ action, label, disabled, styleName }: { action: string; label: string; disabled: boolean; styleName: "amber" | "emerald" | "red" }) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <button type="submit" name="action" value={action} disabled={disabled} className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-black disabled:opacity-60 ${styles[styleName]}`}>
      {label}
    </button>
  );
}
