"use client";

import { useActionState } from "react";
import { manageOwnPostStatus, type ManagePostActionState } from "@/features/posts/actions";
import type { PostStatus } from "@/features/posts/types";

const initialState: ManagePostActionState = { ok: true, message: "" };

type ProfileUserPostManagementActionsProps = {
  postId: string;
  status?: PostStatus;
};

export function ProfileUserPostManagementActions({ postId, status }: ProfileUserPostManagementActionsProps) {
  const [state, formAction, pending] = useActionState(manageOwnPostStatus, initialState);
  const canHide = status === "published";
  const canDelete = status !== "deleted";

  if (!canHide && !canDelete) {
    return null;
  }

  return (
    <form
      action={formAction}
      className="inline-flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "delete" && !window.confirm("确认删除这条内容？删除后前台不会再显示。")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      {canHide ? (
        <button
          type="submit"
          name="action"
          value="hide"
          disabled={pending}
          className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          隐藏
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="submit"
          name="action"
          value="delete"
          disabled={pending}
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          删除
        </button>
      ) : null}
      {state.message ? <span className={state.ok ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-600"}>{state.message}</span> : null}
    </form>
  );
}
