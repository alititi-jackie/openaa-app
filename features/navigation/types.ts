export type NavigationOpenMode = "same" | "new";

export type NavigationQueryState = "ready" | "missing_config" | "error";

export type NavigationQueryResult<T> = {
  state: NavigationQueryState;
  data: T;
  error?: string;
};

export type NavigationCategoryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

export type NavigationImageAsset = {
  public_url: string | null;
  external_url: string | null;
};

export type NavigationLinkRecord = {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
  icon_image_asset_id: string | null;
  open_mode: NavigationOpenMode | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  navigation_categories?: NavigationCategoryRecord[] | NavigationCategoryRecord | null;
  image_assets?: NavigationImageAsset[] | NavigationImageAsset | null;
};

export type UserNavigationLinkRecord = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean | null;
  open_mode: NavigationOpenMode | null;
  created_at: string;
  updated_at: string;
};

export type NavigationCategory = {
  id: string | null;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type NavigationLink = {
  id: string;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string | null;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
  imageUrl: string | null;
  openMode: NavigationOpenMode;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserNavigationLink = {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  openMode: NavigationOpenMode;
  createdAt: string;
  updatedAt: string;
};

export type AdminNavigationPermissions = {
  manageNavigation: boolean;
};
