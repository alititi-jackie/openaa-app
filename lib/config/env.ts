export const appEnv = process.env.NEXT_PUBLIC_APP_ENV || "development";

export const isProduction = appEnv === "production";
