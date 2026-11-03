"use client";
import { ViewDisplaySettings } from "@/components/admin/ViewDisplaySettings";
import { updateNewsViewSettings } from "@/features/news/viewActions";
import type { NewsViewSettings as Settings } from "@/features/news/viewSettings";

export function NewsViewSettings(props: { initial: Settings; available: boolean; canEdit: boolean }) {
  return <ViewDisplaySettings {...props} saveSettings={updateNewsViewSettings} permissionMessage="需要新闻发布权限才能修改。" />;
}
