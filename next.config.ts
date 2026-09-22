import type { NextConfig } from "next";

// Security headers applied on every response in production.
// In development the Cache-Control: no-store header is added instead.
const SECURITY_HEADERS = [
  // Prevent the app from being embedded in an iframe on other origins.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop browsers from MIME-sniffing the content-type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer information sent to third-party sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unused browser features.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Content Security Policy.
  // - Cloudflare Turnstile widget needs: script-src challenges.cloudflare.com, frame-src challenges.cloudflare.com
  // - Banner images served from same origin (/banners/*)
  // - 'unsafe-inline' for styles: required by Tailwind CSS (inline style attributes)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Smaller Docker image (copies traced server bundle only).
  output: "standalone",
  // next dev blocks /_next/* from non-localhost origins unless listed here.
  // Without this, tunnel domains render HTML but React never hydrates
  // (eye toggle / login fetch appear broken).
  allowedDevOrigins: ["dev.smhcloud.my.id"],
  async headers() {
    if (process.env.NODE_ENV !== "production") {
      // Tunnel/CDN often caches Turbopack chunks; stale modules break hydration.
      return [
        {
          source: "/:path*",
          headers: [
            { key: "Cache-Control", value: "no-store, must-revalidate" },
          ],
        },
      ];
    }
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
