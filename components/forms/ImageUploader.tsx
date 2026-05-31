"use client";

import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";
import type { UploadedImageInput } from "@/features/posts/formTypes";

type ImageUploaderProps = {
  images: UploadedImageInput[];
  onChange: (images: UploadedImageInput[]) => void;
  disabled?: boolean;
  maxImages?: number;
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

export function ImageUploader({ images, onChange, disabled, maxImages = 6 }: ImageUploaderProps) {
  const canAdd = images.length < maxImages && !disabled;

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, maxImages - images.length);
    if (files.length === 0) return;
    const next = await Promise.all(files.map(compressImage));
    onChange([...images, ...next]);
    event.target.value = "";
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950">图片</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">最多 6 张，客户端会先压缩为 webp。</p>
        </div>
        <label
          className={[
            "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold",
            canAdd ? "bg-slate-950 text-white" : "cursor-not-allowed bg-slate-200 text-slate-500",
          ].join(" ")}
        >
          <ImagePlus size={16} aria-hidden="true" />
          添加
          <input type="file" accept="image/*" multiple disabled={!canAdd} onChange={onFiles} className="sr-only" />
        </label>
      </div>

      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">暂无图片</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div key={`${image.url ?? image.imageAssetId ?? index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="text-xs font-bold text-slate-500">{image.imageAssetId ? "已保存" : "待上传"}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(index, -1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600" aria-label="上移">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600" aria-label="下移">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg border border-rose-100 p-1.5 text-rose-600" aria-label="删除">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
