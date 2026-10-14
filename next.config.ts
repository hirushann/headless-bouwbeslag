import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";

// Next.js needs inline scripts/styles; GTM and WebwinkelKeur load from third-party hosts.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms https://www.webwinkelkeur.nl https://dashboard.webwinkelkeur.nl`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https:${isDev ? " http:" : ""}`,
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.googletagmanager.com https://www.webwinkelkeur.nl https://dashboard.webwinkelkeur.nl",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app.bouwbeslag.nl",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "empire.test",
      },
      {
        protocol: "https",
        hostname: "empire.test",
      },
      {
        protocol: "https",
        hostname: "empire.dayzsolutions.nl",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/wp-content/:path*',
        destination: 'https://app.bouwbeslag.nl/wp-content/:path*',
      },
      {
        source: '/wp-includes/:path*',
        destination: 'https://app.bouwbeslag.nl/wp-includes/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
