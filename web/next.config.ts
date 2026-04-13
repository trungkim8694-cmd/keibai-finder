import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bit.sikkou.jp',
      },
      {
        protocol: 'https',
        hostname: 'www.bit.courts.go.jp',
      },
      {
        protocol: 'https',
        hostname: 'www.koubai.nta.go.jp',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/property_images/:path*',
        destination: 'http://35.79.228.176/property_images/:path*'
      },
      {
        source: '/pdfs/:path*',
        destination: 'http://35.79.228.176/pdfs/:path*'
      }
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
