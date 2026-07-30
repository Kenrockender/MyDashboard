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
  // @react-pdf/renderer (and its whole dependency chain) ships ESM-only —
  // this makes both Next's own build and next/jest's Jest transform (which
  // derives its transformIgnorePatterns from this list) transpile them
  // instead of erroring on bare `import` in node_modules.
  transpilePackages: [
    "@react-pdf/renderer",
    "@react-pdf/primitives",
    "@react-pdf/pdfkit",
    "@react-pdf/fns",
    "@react-pdf/font",
    "@react-pdf/image",
    "@react-pdf/layout",
    "@react-pdf/reconciler",
    "@react-pdf/render",
    "@react-pdf/stylesheet",
    "@react-pdf/svg",
    "@react-pdf/textkit",
    "yoga-layout",
    "color-string",
    "color-name",
  ],
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
