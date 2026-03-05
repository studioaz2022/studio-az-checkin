import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' as const }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/msgsndr/**',
      },
      {
        protocol: 'https',
        hostname: 'msgsndr-private.storage.googleapis.com',
        pathname: '/user/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.cdn.filesafe.space',
        pathname: '/GLRkNAxfPtWTqTiN83xj/**',
      },
    ],
  },
};

export default nextConfig;
