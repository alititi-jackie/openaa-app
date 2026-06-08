"use client";

import { useActionState } from "react";
import { manageOwnPostStatus, type ManagePostActionState } from "@/features/posts/actions";
import type { PostStatus, PostType } from "@/features/posts/types";
import { ProfilePostVisibilityButton } from "./ProfilePostVisibilityButton";

const initialState: ManagePostActionState = { ok: true, message: "" };

export function UserPostManagementActions({
  postId,
  postType,
  status,
  onStatusChange,
  onMessage,
}: {
  postId: string;
  postType: PostType;
  status?: PostStatus;
  onStatusChange: (status: PostStatus) => void;
  onMessage: (state: { ok: boolean; message: string }) => void;
}) {
  const [state, formAction, pending] = useActionState(manageOwnPostStatus, initialState);
  const canToggleVisibility = status === "published" || status === "hidden";
  const canDelete = status !== "deleted";

  if (!canToggleVisibility && !canDelete) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {canToggleVisibility ? (
          <ProfilePostVisibilityButton
            postId={postId}
            postType={postType}
            status={status}
            onStatusChange={onStatusChange}
            onMessage={onMessage}
          />
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
              className="min-h-9 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              删除
            </button>
          </form>
        ) : null}
      </div>
      {state.message ? <p className={state.ok ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-600"}>{state.message}</p> : null}
    </div>
  );
}
