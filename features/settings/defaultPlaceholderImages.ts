import type { DefaultPostPlaceholderImages, PostType } from "@/features/posts/types";

export type DefaultPlaceholderImageKey =
  | "default_marketplace_placeholder_image"
  | "default_service_placeholder_image";

export type DefaultPlaceholderImageConfig = {
  key: DefaultPlaceholderImageKey;
  label: string;
  postType: Extract<PostType, "marketplace" | "service">;
  description: string;
};

export type DefaultPlaceholderImageValue = {
  url: string | null;
  imageAssetId: string | null;
  sourceType: "storage" | "external" | null;
};

export const DEFAULT_PLACEHOLDER_IMAGE_CONFIGS: DefaultPlaceholderImageConfig[] = [
  {
    key: "default_marketplace_placeholder_image",
    label: "二手默认占位图片",
    postType: "marketplace",
    description: "二手信息没有用户上传图片时，前台自动使用这张图。",
  },
  {
    key: "default_service_placeholder_image",
    label: "本地服务默认占位图片",
    postType: "service",
    description: "本地服务信息没有用户上传图片时，前台自动使用这张图。",
  },
];

export const DEFAULT_PLACEHOLDER_IMAGE_KEYS = DEFAULT_PLACEHOLDER_IMAGE_CONFIGS.map((config) => config.key);

export function isDefaultPlaceholderImageKey(value: string): value is DefaultPlaceholderImageKey {
  return DEFAULT_PLACEHOLDER_IMAGE_KEYS.includes(value as DefaultPlaceholderImageKey);
}

export function emptyPlaceholderImageValue(): DefaultPlaceholderImageValue {
  return { url: null, imageAssetId: null, sourceType: null };
}

export function normalizePlaceholderImageValue(value: unknown): DefaultPlaceholderImageValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyPlaceholderImageValue();
  const record = value as Record<string, unknown>;
  const url = typeof record.url === "string" && record.url.trim() ? record.url.trim() : null;
  const imageAssetId = typeof record.imageAssetId === "string" && record.imageAssetId.trim()
    ? record.imageAssetId.trim()
    : typeof record.image_asset_id === "string" && record.image_asset_id.trim()
      ? record.image_asset_id.trim()
      : null;
  const rawSourceType = record.sourceType ?? record.source_type;
  const sourceType = rawSourceType === "storage" || rawSourceType === "external" ? rawSourceType : url ? "external" : null;
  return { url, imageAssetId, sourceType };
}

export function placeholderImagesFromSettings(
  values: Partial<Record<DefaultPlaceholderImageKey, DefaultPlaceholderImageValue>>,
): DefaultPostPlaceholderImages {
  return {
    marketplace: values.default_marketplace_placeholder_image?.url ?? undefined,
    service: values.default_service_placeholder_image?.url ?? undefined,
  };
}
