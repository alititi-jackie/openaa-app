import type { DirectoryItemType } from "./types";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(formData: FormData, key: string, label: string) {
  const raw = readText(formData, key);
  if (!raw) return 0;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`${label} 必须是整数。`);
  return value;
}

export function parseDirectoryItemType(value: string): DirectoryItemType | null {
  if (value === "phone" || value === "address") return value;
  return null;
}

function labelFor(itemType: DirectoryItemType) {
  return itemType === "phone"
    ? { name: "姓名", value: "电话号码" }
    : { name: "名称", value: "地址" };
}

export function validateDirectoryItemForm(formData: FormData): ValidationResult<{
  id: string | null;
  itemType: DirectoryItemType;
  name: string;
  value: string;
  sortOrder: number;
}> {
  try {
    const itemType = parseDirectoryItemType(readText(formData, "item_type"));
    if (!itemType) return { ok: false, message: "请选择电话本或地址。" };

    const labels = labelFor(itemType);
    const name = readText(formData, "name");
    const value = readText(formData, "value");

    if (!name) return { ok: false, message: `${labels.name}不能为空。` };
    if (!value) return { ok: false, message: `${labels.value}不能为空。` };
    if (name.length > 80) return { ok: false, message: `${labels.name}不能超过 80 个字。` };
    if (value.length > 240) return { ok: false, message: `${labels.value}不能超过 240 个字。` };

    return {
      ok: true,
      value: {
        id: readText(formData, "id") || null,
        itemType,
        name,
        value,
        sortOrder: readInteger(formData, "sort_order", "排序"),
      },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "电话地址本表单格式不正确。" };
  }
}
