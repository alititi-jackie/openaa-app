"use client";

import { useState } from "react";
import { ProfilePostVisibilityButton } from "@/components/posts/ProfilePostVisibilityButton";
import { ProfilePostConfirmDialog } from "@/components/posts/ProfilePostConfirmDialog";
import { deleteOwnPostPermanently } from "@/features/posts/actions";
import type { PostStatus, PostType } from "@/features/posts/types";

type ProfileUserPostManagementActionsProps = {
  postId: string;
  postType: PostType;
  status?: PostStatus;
  onStatusChange: (status: PostStatus) => void;
  onDeleted: () => void;
  onMessage: (state: { ok: boolean; message: string }) => void;
};

export function ProfileUserPostManagementActions({ postId, postType, status, onStatusChange, onDeleted, onMessage }: ProfileUserPostManagementActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
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
        <>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={deletePending}
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            删除
          </button>
          <ProfilePostConfirmDialog
            open={deleteOpen}
            title="确认删除此信息？"
            description="删除后将无法恢复，请谨慎操作。"
            confirmLabel="删除"
            confirmTone="danger"
            pending={deletePending}
            onCancel={() => setDeleteOpen(false)}
            onConfirm={() => {
              void deletePost();
            }}
          />
        </>
      ) : null}
    </div>
  );

  async function deletePost() {
    setDeletePending(true);
    try {
      const result = await deleteOwnPostPermanently(postId);
      onMessage({ ok: result.ok, message: result.message });
      if (result.ok) {
        setDeleteOpen(false);
        setDeletePending(false);
        onDeleted();
        return;
      }
    } catch {
      onMessage({ ok: false, message: "删除失败，请稍后再试。" });
    }
    setDeletePending(false);
  }
}
