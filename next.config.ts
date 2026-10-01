
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Docker/server deployments build a self-contained server (see Dockerfile and docs/DEPLOY.md);
  // local `next dev` / `next start` keep the default output
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ],
  },
};

export default nextConfig;
