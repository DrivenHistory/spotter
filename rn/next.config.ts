import type { NextConfig } from "next";

const isCapacitor = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  output: isCapacitor ? "export" : undefined,
  images: { unoptimized: isCapacitor },
  async rewrites() {
    if (isCapacitor) return [];
    return [
      { source: "/api/:path*", destination: "https://www.drivenhistory.com/api/:path*" },
    ];
  },
};

export default nextConfig;
