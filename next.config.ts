
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'edm.gov.om', pathname: '/**' },
      { protocol: 'https', hostname: 'apps.edm.gov.om', pathname: '/**' },
      { protocol: 'https', hostname: 'gov.om', pathname: '/**' },
      { protocol: 'https', hostname: 'imgs.search.brave.com', pathname: '/**' },
      { protocol: 'https', hostname: 'oman-daily.com', pathname: '/**' },
      { protocol: 'https', hostname: 'omandaily.om', pathname: '/**' },
      { protocol: 'https', hostname: 'tajawob.om', pathname: '/**' }
    ],
  },
};

export default nextConfig;
