export type FavoriteTargetType = "job" | "housing" | "marketplace" | "service" | "news" | "navigation" | "dmv" | (string & {});

export type FavoriteTarget = {
  type: FavoriteTargetType;
  id: string;
  url: string;
  title: string;
  category?: string | null;
};

export type FavoriteRecord = {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  target_url: string;
  title: string;
  category: string | null;
  created_at: string;
};

export type FavoriteListItem = {
  id: string;
  targetType: string;
  targetId: string;
  targetUrl: string;
  title: string;
  category: string;
  createdAt: string;
  isDeleted: boolean;
};

export type FavoritesQueryResult<T> = {
  state: "ready" | "missing_config" | "error";
  data: T;
  error?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
};
