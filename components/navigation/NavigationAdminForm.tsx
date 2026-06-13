"use client";

import { type Dispatch, type SetStateAction, useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminPermissionBadge } from "@/components/admin/AdminPermissionBadge";
import {
  deleteNavigationLink,
  moveNavigationCategory,
  toggleNavigationLinkFlag,
  updateNavigationCategoryDisplayLimit,
  upsertNavigationLink,
  type NavigationActionState,
} from "@/features/navigation/actions";
import type { AdminNavigationPermissions, NavigationCategory, NavigationLink, NavigationOpenMode } from "@/features/navigation/types";

const initialState: NavigationActionState = { ok: true, message: "" };

const openModeOptions: Array<{ value: NavigationOpenMode; label: string }> = [
  { value: "auto", label: "自动" },
  { value: "same", label: "当前窗口" },
  { value: "new", label: "新窗口" },
];

const buttonBase = "inline-flex min-h-9 items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50";
const neutralButtonClass = `${buttonBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const primaryButtonClass = `${buttonBase} border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100`;
const dangerButtonClass = `${buttonBase} border-red-100 bg-red-50 text-red-600 hover:bg-red-100`;

type LocalLink = NavigationLink & {
  transientMessage?: string;
};

type FormMode = "create" | "edit";

type LinkFormValues = {
  url: string;
  title: string;
  description: string;
  openMode: NavigationOpenMode;
  sortOrder: number;
  categoryId: string;
  isActive: boolean;
};

export function NavigationAdminPermissions({ permissions }: { permissions: AdminNavigationPermissions }) {
  return <AdminPermissionBadge allowed={permissions.manageNavigation} label="manage_navigation" />;
}

export function NavigationLinkAdminList({ links, categories }: { links: NavigationLink[]; categories: NavigationCategory[] }) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [localLinks, setLocalLinks] = useState<LocalLink[]>(links);

  return (
    <div className="space-y-3">
      {localCategories.map((category, index) => (
        <NavigationCategoryCard
          key={category.id ?? category.slug}
          category={category}
          categories={localCategories}
          links={localLinks.filter((link) => link.categoryId === category.id || link.categorySlug === category.slug)}
          isFirst={index === 0}
          isLast={index === localCategories.length - 1}
          onCategoriesChange={setLocalCategories}
          onLinksChange={setLocalLinks}
        />
      ))}
    </div>
  );
}

function NavigationCategoryCard({
  category,
  categories,
  links,
  isFirst,
  isLast,
  onCategoriesChange,
  onLinksChange,
}: {
  category: NavigationCategory;
  categories: NavigationCategory[];
  links: LocalLink[];
  isFirst: boolean;
  isLast: boolean;
  onCategoriesChange: Dispatch<SetStateAction<NavigationCategory[]>>;
  onLinksChange: Dispatch<SetStateAction<LocalLink[]>>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingDisplayLimit, setEditingDisplayLimit] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(category.displayLimit);
  const [displayLimitMessage, setDisplayLimitMessage] = useState("");
  const [pendingDisplayLimit, startDisplayLimitTransition] = useTransition();
  const [pendingMove, startMoveTransition] = useTransition();

  function saveDisplayLimit(formData: FormData) {
    startDisplayLimitTransition(async () => {
      const result = await updateNavigationCategoryDisplayLimit(initialState, formData);
      if (!result.ok) {
        setDisplayLimitMessage(result.message);
        return;
      }

      const nextValue = Number(formData.get("display_limit"));
      setDisplayLimit(nextValue);
      setEditingDisplayLimit(false);
      setDisplayLimitMessage(result.message);
      onCategoriesChange((current) => current.map((item) => (item.id === category.id ? { ...item, displayLimit: nextValue } : item)));
    });
  }

  function move(direction: "up" | "down") {
    if (!category.id) return;
    startMoveTransition(async () => {
      const formData = new FormData();
      formData.set("id", category.id ?? "");
      formData.set("direction", direction);
      const result = await moveNavigationCategory(initialState, formData);
      if (!result.ok) {
        setDisplayLimitMessage(result.message);
        return;
      }

      onCategoriesChange((current) => reorderCategories(current, category.id ?? "", direction));
      setDisplayLimitMessage(result.message);
    });
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-slate-950">{category.name}</h3>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 inline-flex items-center gap-1 text-sm font-black text-blue-700 hover:text-blue-800">
            {expanded ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
            {expanded ? "收起链接" : "展开链接"}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {editingDisplayLimit ? (
            <form action={saveDisplayLimit} className="flex items-center gap-1">
              <input type="hidden" name="id" value={category.id ?? ""} />
              <input
                name="display_limit"
                type="number"
                min={0}
                max={999}
                defaultValue={displayLimit}
                autoFocus
                className="h-9 w-16 rounded-full border border-blue-200 bg-white px-2 text-center text-sm font-black text-slate-950 outline-none focus:border-blue-500"
              />
              <button type="submit" disabled={pendingDisplayLimit} className={primaryButtonClass}>
                保存
              </button>
              <button type="button" disabled={pendingDisplayLimit} onClick={() => setEditingDisplayLimit(false)} className={neutralButtonClass}>
                取消
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingDisplayLimit(true);
                setDisplayLimitMessage("");
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-950 hover:border-blue-200 hover:text-blue-700"
              aria-label="编辑前台显示数量"
            >
              {displayLimit}
            </button>
          )}

          <button type="button" onClick={() => move("up")} disabled={isFirst || pendingMove || !category.id} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="上移分类">
            <ChevronUp size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => move("down")} disabled={isLast || pendingMove || !category.id} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="下移分类">
            <ChevronDown size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      {displayLimitMessage ? <p className="mt-3 text-sm font-semibold text-emerald-700">{displayLimitMessage}</p> : null}

      {expanded ? (
        <div className="mt-4 space-y-3">
          <div>
            {creating ? (
              <div className="rounded-2xl border border-blue-200 bg-white p-2">
                <NavigationLinkEditor
                  mode="create"
                  category={category}
                  categories={categories}
                  onCancel={() => setCreating(false)}
                  onSaved={(link, message) => {
                    setCreating(false);
                    onLinksChange((current) => [
                      { ...link, categoryId: category.id, categoryName: category.name, categorySlug: category.slug, transientMessage: message },
                      ...current,
                    ]);
                  }}
                />
              </div>
            ) : (
              <button type="button" onClick={() => setCreating(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100">
                <Plus size={16} aria-hidden="true" />
                新增网站
              </button>
            )}
          </div>

          {links.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">暂无网站。</p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <NavigationLinkAdminCard key={link.id} link={link} categories={categories} currentCategory={category} onLinksChange={onLinksChange} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function NavigationLinkAdminCard({
  link,
  categories,
  currentCategory,
  onLinksChange,
}: {
  link: LocalLink;
  categories: NavigationCategory[];
  currentCategory: NavigationCategory;
  onLinksChange: Dispatch<SetStateAction<LocalLink[]>>;
}) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingToggle, startToggleTransition] = useTransition();
  const [pendingDelete, startDeleteTransition] = useTransition();

  function setMessage(message: string) {
    onLinksChange((current) => current.map((item) => (item.id === link.id ? { ...item, transientMessage: message } : item)));
  }

  function toggleVisible() {
    startToggleTransition(async () => {
      const formData = new FormData();
      formData.set("id", link.id);
      formData.set("field", "is_active");
      formData.set("value", link.isActive ? "false" : "true");
      const result = await toggleNavigationLinkFlag(initialState, formData);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      onLinksChange((current) =>
        current.map((item) =>
          item.id === link.id
            ? {
                ...item,
                isActive: !link.isActive,
                transientMessage: result.message,
              }
            : item,
        ),
      );
    });
  }

  function deleteLink() {
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("id", link.id);
      const result = await deleteNavigationLink(initialState, formData);
      if (!result.ok) {
        setMessage(result.message);
        setDeleteOpen(false);
        return;
      }

      onLinksChange((current) => current.filter((item) => item.id !== link.id));
      setDeleteOpen(false);
    });
  }

  return (
    <article className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-black text-slate-950">{link.title}</h4>
          <p className="mt-1 break-all text-xs font-semibold text-slate-500">{link.url}</p>
          {link.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{link.description}</p> : null}
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {link.isActive ? "显示" : "隐藏"} · {openModeLabel(link.openMode)} · {link.sortOrder}
          </p>
        </div>
        {link.transientMessage ? <p className="mt-3 text-sm font-semibold leading-6 text-emerald-700">{link.transientMessage}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setEditing((value) => !value)} className={neutralButtonClass}>
            <Pencil size={14} aria-hidden="true" />
            编辑
          </button>
          <button type="button" onClick={toggleVisible} disabled={pendingToggle} className={neutralButtonClass}>
            {link.isActive ? "隐藏" : "显示"}
          </button>
          <button type="button" onClick={() => setDeleteOpen(true)} disabled={pendingDelete} className={dangerButtonClass}>
            <Trash2 size={14} aria-hidden="true" />
            删除
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 rounded-2xl border border-blue-200 bg-white p-2">
          <NavigationLinkEditor
            mode="edit"
            link={link}
            category={currentCategory}
            categories={categories}
            onCancel={() => setEditing(false)}
            onSaved={(updatedLink, message) => {
              setEditing(false);
              onLinksChange((current) =>
                current.map((item) =>
                  item.id === link.id
                    ? { ...item, ...updatedLink, categoryId: link.categoryId, categoryName: link.categoryName, categorySlug: link.categorySlug, transientMessage: message }
                    : item,
                ),
              );
            }}
          />
        </div>
      ) : null}

      <AdminConfirmDialog
        open={deleteOpen}
        title="确认删除网站？"
        description="删除后无法恢复。"
        confirmLabel="确认删除"
        cancelLabel="取消"
        tone="danger"
        pending={pendingDelete}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={deleteLink}
      />
    </article>
  );
}

function NavigationLinkEditor({
  mode,
  link,
  category,
  categories,
  onCancel,
  onSaved,
}: {
  mode: FormMode;
  link?: NavigationLink;
  category: NavigationCategory;
  categories: NavigationCategory[];
  onCancel: () => void;
  onSaved: (link: LocalLink, message: string) => void;
}) {
  const initialCategoryId = link?.categoryId ?? category.id ?? "";
  const [values, setValues] = useState<LinkFormValues>({
    url: link?.url ?? "",
    title: link?.title ?? "",
    description: link?.description ?? "",
    openMode: link?.openMode ?? "auto",
    sortOrder: link?.sortOrder ?? 0,
    categoryId: initialCategoryId,
    isActive: link?.isActive ?? true,
  });
  const [titleTouched, setTitleTouched] = useState(Boolean(link?.title));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const original = useMemo(() => valuesFromLink(link, initialCategoryId), [initialCategoryId, link]);

  function updateUrl(nextUrl: string) {
    setValues((current) => ({
      ...current,
      url: nextUrl,
      title: mode === "create" || !current.title.trim() ? (!titleTouched ? titleFromUrl(nextUrl) : current.title) : current.title,
    }));
  }

  function submit() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", link?.id ?? "");
      formData.set("category_id", values.categoryId);
      formData.set("url", values.url);
      formData.set("title", values.title || titleFromUrl(values.url));
      formData.set("description", values.description);
      formData.set("open_mode", values.openMode);
      formData.set("sort_order", String(values.sortOrder));
      if (values.isActive) formData.set("is_active", "on");

      const result = await upsertNavigationLink(initialState, formData);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      const selectedCategory = categories.find((item) => item.id === values.categoryId);
      const savedLink: LocalLink = {
        id: result.id ?? link?.id ?? `temp-${Date.now()}`,
        categoryId: values.categoryId,
        categoryName: selectedCategory?.name ?? link?.categoryName ?? category.name,
        categorySlug: selectedCategory?.slug ?? link?.categorySlug ?? category.slug,
        title: values.title || titleFromUrl(values.url),
        description: values.description || null,
        url: values.url,
        icon: null,
        imageUrl: null,
        openMode: values.openMode,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        isFeatured: link?.isFeatured ?? false,
        deletedAt: null,
        createdAt: link?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSaved(savedLink, mode === "create" ? createAddedMessage(values, category, categories) : createEditedMessage(values, original, category, categories));
    });
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="网址" value={values.url} onChange={updateUrl} required />
        <TextField
          label="网站名称"
          value={values.title}
          onChange={(value) => {
            setTitleTouched(true);
            setValues((current) => ({ ...current, title: value }));
          }}
          required
        />
        <TextField label="说明" value={values.description} onChange={(value) => setValues((current) => ({ ...current, description: value }))} />
        <SelectField label="打开方式" value={values.openMode} onChange={(value) => setValues((current) => ({ ...current, openMode: value as NavigationOpenMode }))} options={openModeOptions} />
        <TextField label="排序" type="number" value={String(values.sortOrder)} onChange={(value) => setValues((current) => ({ ...current, sortOrder: Number(value) || 0 }))} />
        <SelectField
          label="分类"
          value={values.categoryId}
          onChange={(value) => setValues((current) => ({ ...current, categoryId: value }))}
          options={categories.flatMap((item) => (item.id ? [{ value: item.id, label: item.name }] : []))}
        />
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
        <input type="checkbox" checked={values.isActive} onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
        前台显示
      </label>

      {message ? <p className="mt-3 text-sm font-semibold text-red-600">{message}</p> : null}

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={pending} className={neutralButtonClass}>
          取消
        </button>
        <button type="button" onClick={submit} disabled={pending} className={primaryButtonClass}>
          {pending ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <input
        value={value}
        type={type}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function reorderCategories(categories: NavigationCategory[], id: string, direction: "up" | "down") {
  const next = [...categories];
  const currentIndex = next.findIndex((category) => category.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= next.length) return next;
  const current = next[currentIndex];
  next[currentIndex] = next[targetIndex];
  next[targetIndex] = current;
  return next.map((category, index) => ({ ...category, sortOrder: (index + 1) * 10 }));
}

function valuesFromLink(link: NavigationLink | undefined, categoryId: string): LinkFormValues {
  return {
    url: link?.url ?? "",
    title: link?.title ?? "",
    description: link?.description ?? "",
    openMode: link?.openMode ?? "auto",
    sortOrder: link?.sortOrder ?? 0,
    categoryId,
    isActive: link?.isActive ?? true,
  };
}

function createAddedMessage(values: LinkFormValues, currentCategory: NavigationCategory, categories: NavigationCategory[]) {
  const parts = ["已新增网址"];
  if (values.openMode !== "auto") parts.push(openModeLabel(values.openMode));
  if (values.sortOrder !== 0) parts.push(String(values.sortOrder));
  const selectedCategory = categories.find((category) => category.id === values.categoryId);
  if (selectedCategory && selectedCategory.id !== currentCategory.id) parts.push(selectedCategory.name);
  if (!values.isActive) parts.push("隐藏");
  return parts.join(" · ");
}

function createEditedMessage(values: LinkFormValues, original: LinkFormValues, currentCategory: NavigationCategory, categories: NavigationCategory[]) {
  const parts = ["导航链接已保存"];
  if (values.url !== original.url) parts.push(values.url);
  if (values.title !== original.title) parts.push(values.title);
  if ((values.description || "") !== (original.description || "")) parts.push(values.description || "无说明");
  if (values.openMode !== original.openMode) parts.push(openModeLabel(values.openMode));
  if (values.sortOrder !== original.sortOrder) parts.push(String(values.sortOrder));
  if (values.categoryId !== original.categoryId) parts.push(categories.find((category) => category.id === values.categoryId)?.name ?? currentCategory.name);
  if (values.isActive !== original.isActive) parts.push(values.isActive ? "显示" : "隐藏");
  return parts.join(" · ");
}

function openModeLabel(value: NavigationOpenMode) {
  if (value === "same") return "当前窗口";
  if (value === "new") return "新窗口";
  return "自动";
}

function titleFromUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    if (trimmed.startsWith("/")) {
      const parts = trimmed.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? "OpenAA";
    }
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.replace(/^www\./, "");
    const parts = hostname.split(".").filter(Boolean);
    const nameParts = parts.length > 2 ? parts.slice(0, -1) : parts.slice(0, 1);
    return nameParts.map(capitalize).join(" ");
  } catch {
    return "";
  }
}

function capitalize(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
