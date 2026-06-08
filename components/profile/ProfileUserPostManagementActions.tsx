"use client";

import { useActionState } from "react";
import { ProfilePostVisibilityButton } from "@/components/posts/ProfilePostVisibilityButton";
import { manageOwnPostStatus, type ManagePostActionState } from "@/features/posts/actions";
import type { PostStatus, PostType } from "@/features/posts/types";

const initialState: ManagePostActionState = { ok: true, message: "" };

type ProfileUserPostManagementActionsProps = {
  postId: string;
  postType: PostType;
  status?: PostStatus;
  onStatusChange: (status: PostStatus) => void;
  onMessage: (state: { ok: boolean; message: string }) => void;
};

export function ProfileUserPostManagementActions({ postId, postType, status, onStatusChange, onMessage }: ProfileUserPostManagementActionsProps) {
  const [state, formAction, pending] = useActionState(manageOwnPostStatus, initialState);
  const canToggleVisibility = status === "published" || status === "hidden";
  const canDelete = status !== "deleted";

  if (!canToggleVisibility && !canDelete) {
    return null;
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {canToggleVisibility ? (
        <ProfilePostVisibilityButton postId={postId} postType={postType} status={status} onStatusChange={onStatusChange} onMessage={onMessage} />
      ) : null}
      {canDelete ? (
        <form
          action={formAction}
          onSubmit={(event) => {
            const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
            if (submitter?.value === "delete" && !window.confirm("确认删除这条内容？删除后前台不会再显示。")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="postId" value={postId} />
          <button
            type="submit"
            name="action"
            value="delete"
            disabled={pending}
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            删除
          </button>
        </form>
      ) : null}
      {state.message ? <span className={state.ok ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-600"}>{state.message}</span> : null}
    </div>
  );
}
