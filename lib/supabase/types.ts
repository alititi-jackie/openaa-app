export type AccountType = "personal" | "business";
export type ProfileStatus = "active" | "restricted" | "banned" | "pending";
export type AdminRoleName = "super_admin" | "admin" | "editor" | "moderator" | "support";
export type PermissionEffect = "allow" | "deny";
export type ConsentType = "terms" | "privacy" | "community_guidelines";

export type Profile = {
  id: string;
  email: string | null;
  email_verified: boolean;
  nickname: string | null;
  avatar_url: string | null;
  phone: string | null;
  wechat_id: string | null;
  whatsapp: string | null;
  preferred_contact_method: string | null;
  bio: string | null;
  location_area: string | null;
  account_type: AccountType;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
};

export type BusinessProfile = {
  id: string;
  user_id: string;
  business_name: string;
  business_category: string | null;
  business_profile: string | null;
  website_url: string | null;
  public_phone: string | null;
  public_email: string | null;
  public_wechat: string | null;
  service_area: string | null;
  is_public: boolean;
  is_active: boolean;
};

export type AdminRoleRecord = {
  id: string;
  user_id: string;
  role: AdminRoleName;
  is_active: boolean;
  note: string | null;
  granted_at: string;
  last_admin_login_at: string | null;
};
