"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { manageOwnPostStatus, type ManagePostActionState } from "@/features/posts/actions";
import type { PostStatus, PostType } from "@/features/posts/types";
import { ProfilePostConfirmDialog } from "./ProfilePostConfirmDialog";

const initialState: ManagePostActionState = { ok: true, message: "" };

const typeNouns: Record<PostType, string> = {
  job: "招聘信息",
  housing: "房屋信息",
  marketplace: "商品信息",
  service: "服务信息",
};

type VisibilityAction = "hide" | "publish";

type ProfilePostVisibilityButtonProps = {
  postId: string;
  postType: PostType;
  status?: PostStatus;
  onStatusChange: (status: PostStatus, message: string) => void;
  onMessage: (state: { ok: boolean; message: string }) => void;
};

export function ProfilePostVisibilityButton({ postId, postType, status, onStatusChange, onMessage }: ProfilePostVisibilityButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(manageOwnPostStatus, initialState);
  const [confirmAction, setConfirmAction] = useState<VisibilityAction | null>(null);

  const action = status === "published" ? "hide" : status === "hidden" ? "publish" : null;

  useEffect(() => {
    if (!state.message || state.postId !== postId) return;

    onMessage({ ok: state.ok, message: state.message });
    if (!state.ok) return;

    if (state.action === "hide") {
      onStatusChange("hidden", state.message);
    }

    if (state.action === "publish") {
      onStatusChange("published", state.message);
    }
  }, [onMessage, onStatusChange, postId, state]);

  if (!action) return null;

  const isHide = action === "hide";
  const noun = typeNouns[postType];
  const title = isHide ? `确认隐藏此${noun}？` : `确认恢复显示此${noun}？`;
  const buttonLabel = isHide ? "隐藏" : "恢复显示";
  const buttonClass = isHide
    ? "text-amber-700 ring-amber-200 bg-amber-50 hover:bg-amber-100"
    : "text-emerald-700 ring-emerald-200 bg-emerald-50 hover:bg-emerald-100";

  return (
    <>
      <form ref={formRef} action={formAction} className="contents">
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="action" value={action} />
        <button
          type="button"
          onClick={() => setConfirmAction(action)}
          disabled={pending}
          className={`px-3 py-2 rounded-lg text-sm ring-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
        >
          {buttonLabel}
        </button>
      </form>
      <ProfilePostConfirmDialog
        open={confirmAction === action}
        title={title}
        pending={pending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
