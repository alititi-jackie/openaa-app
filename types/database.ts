/**
 * Placeholder database types for Phase 2.
 *
 * Do not treat this file as generated Supabase types. Once the new Supabase
 * project is connected, generate the real Database type with Supabase CLI and
 * replace this scaffold.
 */

export type PostType = "job" | "housing" | "marketplace" | "service";

export type PostStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "hidden"
  | "rejected"
  | "expired"
  | "deleted";

export type AccountType = "personal" | "business";

export type ProfileStatus = "active" | "restricted" | "banned" | "pending";

export type AdminRole = "super_admin" | "admin" | "editor" | "moderator" | "support";

export type ImageSourceType = "storage" | "external";

export type FeatureVisibility = "public" | "admin_only" | "beta" | "hidden";

export type DatabaseTypeGenerationStatus = {
  source: "manual-placeholder";
  replaceWith: "supabase-cli-generated-types";
};
