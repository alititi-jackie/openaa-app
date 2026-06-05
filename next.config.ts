import type { NextConfig } from "next";

function supabaseImageHostname() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return null;

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

const supabaseHostname = supabaseImageHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.openaa.com",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
