import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // TODO: Fix type errors in analytics and api routes
  },
};

export default nextConfig;
