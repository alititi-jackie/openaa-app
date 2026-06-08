export const POST_IMAGE_CONFIG = {
  enabledPostTypes: ["housing", "marketplace", "service"],
  maxImages: 3,
  maxUploadBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  extensionByMimeType: {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  },
  compression: {
    maxSideSteps: [1600, 1280, 1024],
    targetBytes: 1250 * 1024,
    maxCompressedBytes: 1536 * 1024,
    mimeType: "image/webp",
    extension: "webp",
    qualitySteps: [0.82, 0.74, 0.66, 0.58, 0.5, 0.42],
  },
  cover: {
    firstImageIsCover: true,
  },
} as const;

export type PostImageMimeType = keyof typeof POST_IMAGE_CONFIG.extensionByMimeType;

export function isPostImageEnabled(postType: string) {
  return POST_IMAGE_CONFIG.enabledPostTypes.some((type) => type === postType);
}

export function postImageExtension(mimeType: string) {
  return POST_IMAGE_CONFIG.extensionByMimeType[mimeType as PostImageMimeType];
}
