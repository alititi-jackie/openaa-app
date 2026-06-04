"use client";

import { useActionState } from "react";
import { manageOwnPostStatus, type ManagePostActionState } from "@/features/posts/actions";
import type { PostStatus } from "@/features/posts/types";

const initialState: ManagePostActionState = { ok: true, message: "" };

export function UserSecondhandManagementActions({ postId, status }: { postId: string; status?: PostStatus }) {
  const [state, formAction, pending] = useActionState(manageOwnPostStatus, initialState);
  const canHide = status === "published";
  const canPublish = status === "hidden" || status === "draft" || status === "expired";
  const canDelete = status !== "deleted";

  if (!canHide && !canPublish && !canDelete) return null;

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "hide" && !window.confirm("确认隐藏此商品？")) event.preventDefault();
        if (submitter?.value === "delete" && !window.confirm("确认删除此商品？")) event.preventDefault();
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
    amber: "text-amber-700 ring-1 ring-amber-200 bg-amber-50 hover:bg-amber-100",
    emerald: "text-emerald-700 ring-1 ring-emerald-200 bg-emerald-50 hover:bg-emerald-100",
    red: "text-red-600 ring-1 ring-red-200 bg-red-50 hover:bg-red-100",
  };

  return (
    <button type="submit" name="action" value={action} disabled={disabled} className={`rounded-lg px-3 py-2 text-sm transition disabled:opacity-60 ${styles[styleName]}`}>
      {label}
    </button>
  );
}
