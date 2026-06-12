export type SearchResultType = "jobs" | "housing" | "secondhand" | "services" | "news" | "navigation";

export type SearchResultItem = {
  id: string;
  type: SearchResultType;
  label: string;
  title: string;
  description: string;
  href: string;
  meta?: string;
  external?: boolean;
};

export type SearchQueryResult = {
  state: "ready" | "missing_config" | "error";
  data: SearchResultItem[];
  error?: string;
  channels: Record<SearchResultType, boolean>;
};
