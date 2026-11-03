"use client";
import { ViewDisplaySettings } from "@/components/admin/ViewDisplaySettings";
import { updatePostViewSettings } from "@/features/posts/viewActions";
import type { PostViewSettings as Settings } from "@/features/posts/viewSettings";

export function PostViewSettings(props: { initial: Settings; available: boolean; canEdit: boolean }) {
  return <ViewDisplaySettings {...props} saveSettings={updatePostViewSettings} permissionMessage="需要用户发布信息管理权限才能修改。" />;
}
