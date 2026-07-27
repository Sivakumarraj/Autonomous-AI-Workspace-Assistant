import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emits .next/standalone, which docker/frontend.Dockerfile copies. Without
  // this the production image build fails on a missing directory.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
