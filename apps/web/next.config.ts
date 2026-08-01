import type { NextConfig } from "next";

// Mirrors the header set `helmet()` used to apply when this API ran as a
// separate NestJS app — scoped to /api/* since that's the only surface
// helmet ever covered (it served JSON only, never HTML/pages).
const API_SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Download-Options", value: "noopen" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-XSS-Protection", value: "0" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  /**
   * @react-pdf/renderer must be external, NOT transpiled into the server
   * bundle. Bundling it puts its reconciler in the React Server Components
   * graph, where `react` resolves to the `react-server` build — which has no
   * client dispatcher internals, so the reconciler crashes with
   * "Cannot read properties of undefined (reading 'S')" on every render.
   * Leaving it external means Node resolves it normally at runtime and it
   * gets the full React build.
   *
   * These packages are ESM-only, so Jest needs them transformed too — that's
   * configured directly via `transformIgnorePatterns` in jest.config.ts
   * rather than being derived from a `transpilePackages` list here.
   */
  serverExternalPackages: ["@react-pdf/renderer"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: API_SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
