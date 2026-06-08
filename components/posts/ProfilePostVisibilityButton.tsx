"use client";

import { useState } from "react";
import { manageOwnPostStatus } from "@/features/posts/actions";
import type { PostStatus, PostType } from "@/features/posts/types";
import { ProfilePostConfirmDialog } from "./ProfilePostConfirmDialog";

const initialState = { ok: true, message: "" };

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
  const [confirmAction, setConfirmAction] = useState<VisibilityAction | null>(null);
  const [pending, setPending] = useState(false);

  const action = status === "published" ? "hide" : status === "hidden" ? "publish" : null;

  if (!action) return null;

  const isHide = action === "hide";
  const noun = typeNouns[postType];
  const title = isHide ? `确认隐藏此${noun}？` : `确认恢复显示此${noun}？`;
  const buttonLabel = isHide ? "隐藏" : "恢复显示";
  const buttonClass = isHide
    ? "text-amber-700 ring-amber-200 bg-amber-50 hover:bg-amber-100"
    : "text-emerald-700 ring-emerald-200 bg-emerald-50 hover:bg-emerald-100";

  async function runVisibilityAction(nextAction: VisibilityAction) {
    setPending(true);
    const formData = new FormData();
    formData.set("postId", postId);
    formData.set("action", nextAction);

    try {
      const result = await manageOwnPostStatus(initialState, formData);
      onMessage({ ok: result.ok, message: result.message });
      if (!result.ok) return;

      if (result.action === "hide") {
        onStatusChange("hidden", result.message);
      }

      if (result.action === "publish") {
        onStatusChange("published", result.message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmAction(action)}
        disabled={pending}
        className={`px-3 py-2 rounded-lg text-sm ring-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
      >
        {buttonLabel}
      </button>
      <ProfilePostConfirmDialog
        open={confirmAction === action}
        title={title}
        pending={pending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          const nextAction = confirmAction;
          setConfirmAction(null);
          void runVisibilityAction(nextAction);
        }}
      />
    </>
  );
}
