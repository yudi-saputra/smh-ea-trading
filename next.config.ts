import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Smaller Docker image (copies traced server bundle only).
  output: "standalone",
  // next dev blocks /_next/* from non-localhost origins unless listed here.
  // Without this, tunnel domains render HTML but React never hydrates
  // (eye toggle / login fetch appear broken).
  allowedDevOrigins: ["dev.smhcloud.my.id"],
  // Tunnel/CDN often caches Turbopack chunks; stale modules break hydration.
  async headers() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
