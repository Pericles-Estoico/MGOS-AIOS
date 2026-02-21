import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Fix type errors
  },

  // Support multiple domains
  // marketplace.aios.local (internal)
  // www.sellersops.com.br (public)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // CORS for both domains
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? process.env.NEXT_PUBLIC_API_URL || '*'
              : '*',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization',
          },
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },

  // Environment variables for multi-domain support
  env: {
    NEXT_PUBLIC_APP_NAME: 'Marketplace Master',
    NEXT_PUBLIC_DOMAIN_MARKETPLACE: 'marketplace.aios.local',
    NEXT_PUBLIC_DOMAIN_SELLERSOPS: 'www.sellersops.com.br',
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
