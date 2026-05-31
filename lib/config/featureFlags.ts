export const featureFlags = {
  auth_email: true,
  auth_google: true,
  auth_apple: false,
  auth_wechat: false,
  auth_phone: false,
  business_profiles_basic: true,
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;
