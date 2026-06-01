"use client";

import { useActionState } from "react";
import { manageOwnPostStatus, type ManagePostActionState } from "@/features/posts/actions";
import type { PostStatus } from "@/features/posts/types";

const initialState: ManagePostActionState = { ok: true, message: "" };

const buttonStyles = {
  hide: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  publish: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  delete: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
};

export function UserPostManagementActions({ postId, status }: { postId: string; status?: PostStatus }) {
  const [state, formAction, pending] = useActionState(manageOwnPostStatus, initialState);
  const canHide = status === "published";
  const canPublish = status === "hidden" || status === "draft" || status === "expired";
  const canDelete = status !== "deleted";

  if (!canHide && !canPublish && !canDelete) {
    return null;
  }

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "delete" && !window.confirm("确认删除这条内容？删除后前台不会再显示。")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <div className="flex flex-wrap items-center gap-2">
        {canHide ? (
          <button
            type="submit"
            name="action"
            value="hide"
            disabled={pending}
            className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles.hide}`}
            title="下架后其他用户暂时看不到，你可以稍后重新发布。"
          >
            下架
          </button>
        ) : null}
        {canPublish ? (
          <button
            type="submit"
            name="action"
            value="publish"
            disabled={pending}
            className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles.publish}`}
          >
            重新发布
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="submit"
            name="action"
            value="delete"
            disabled={pending}
            className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles.delete}`}
          >
            删除
          </button>
        ) : null}
      </div>
      {canHide ? <p className="text-xs leading-5 text-slate-500">下架后其他用户暂时看不到，你可以稍后重新发布。</p> : null}
      {state.message ? (
        <p className={state.ok ? "text-xs font-bold text-emerald-700" : "text-xs font-bold text-red-600"}>{state.message}</p>
      ) : null}
    </form>
  );
}
