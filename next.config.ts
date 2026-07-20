import type { NextConfig } from "next";
import path from "path";

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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
