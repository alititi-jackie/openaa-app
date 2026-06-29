export type DirectoryItemType = "phone" | "address";

export type DirectoryQueryState = "ready" | "missing_config" | "error";

export type DirectoryQueryResult<T> = {
  state: DirectoryQueryState;
  data: T;
  error?: string;
};

export type DirectoryItemRecord = {
  id: string;
  user_id: string;
  item_type: DirectoryItemType;
  name: string;
  value: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DirectoryItem = {
  id: string;
  itemType: DirectoryItemType;
  name: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryPageData = {
  phone: DirectoryItem[];
  address: DirectoryItem[];
};
