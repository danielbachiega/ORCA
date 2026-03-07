import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Enable Docker standalone output
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: 'catalog-api',
      },
    ],
  },
};

export default nextConfig;


