import type { NextConfig } from 'next';

const OPEN_LIBRARY_HOST = 'covers.openlibrary.org';
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api');
const isLocalApi = ['localhost', '127.0.0.1'].includes(apiUrl.hostname);

const nextConfig: NextConfig = {
  images: {
    // Next.js blocks optimizing images served from private addresses by default; uploads of a
    // locally running API live there. Production APIs are on a public host, so this stays off.
    dangerouslyAllowLocalIP: isLocalApi,
    remotePatterns: [
      { protocol: 'https', hostname: OPEN_LIBRARY_HOST },
      {
        protocol: apiUrl.protocol === 'https:' ? 'https' : 'http',
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
