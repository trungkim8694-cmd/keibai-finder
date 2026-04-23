import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.ts',
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
      {
        protocol: 'https',
        hostname: 'nuyfejmbvxkgcitvygcy.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
      },
    ],
  },
  async headers() {
    return [
      {
        // Add immutable caching for any tiles routed through API
        source: '/api/tiles/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
         source: '/api/tiles/flood/:z/:x/:y.png',
         destination: 'https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/:z/:x/:y.png'
      },
      {
         source: '/api/tiles/landslide/:z/:x/:y.png',
         destination: 'https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/:z/:x/:y.png'
      },
      {
         source: '/api/tiles/railway/:z/:x/:y.png',
         destination: 'https://a.tiles.openrailwaymap.org/standard/:z/:x/:y.png'
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
