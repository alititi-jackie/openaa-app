"use client";

import { ImagePlus, X } from "lucide-react";
import type { ChangeEvent } from "react";
import type { UploadedImageInput } from "@/features/posts/formTypes";

type ImageUploaderProps = {
  images: UploadedImageInput[];
  onChange: (images: UploadedImageInput[]) => void;
  disabled?: boolean;
  maxImages?: number;
  error?: string;
};

async function compressImage(file: File): Promise<UploadedImageInput> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = objectUrl;
    });
    const maxSide = 1600;
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    const output = blob ? new File([blob], `${crypto.randomUUID()}.webp`, { type: "image/webp" }) : file;

    return { file: output, url: URL.createObjectURL(output), width, height, sizeBytes: output.size, mimeType: output.type || file.type };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ImageUploader({ images, onChange, disabled, maxImages = 3, error }: ImageUploaderProps) {
  const canAdd = images.length < maxImages && !disabled;

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const allowed = files.slice(0, maxImages - images.length);
    const next = await Promise.all(allowed.map(compressImage));
    onChange([...images, ...next].slice(0, maxImages));
    event.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-gray-700">图片（可选，最多 {maxImages} 张）</label>
        <label
          className={[
            "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition",
            canAdd ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100 hover:bg-blue-100" : "cursor-not-allowed bg-gray-100 text-gray-400",
          ].join(" ")}
        >
          <ImagePlus size={15} aria-hidden="true" />
          添加图片
          <input type="file" accept="image/*" multiple disabled={!canAdd} onChange={onFiles} className="sr-only" />
        </label>
      </div>

      <p className="text-xs leading-5 text-gray-400">客户端会先压缩图片；第一张会作为封面图。</p>
      {error ? <p className="text-xs leading-5 text-red-600">{error}</p> : null}

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {images.slice(0, maxImages).map((image, index) => (
            <div key={`${image.url ?? image.imageAssetId ?? index}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={`preview-${index + 1}`} className="h-24 w-full rounded-lg border border-gray-200 object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                aria-label="删除图片"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
