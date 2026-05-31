import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.openaa.com",
      },
    ],
  },
};

export default nextConfig;
