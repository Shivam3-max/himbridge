import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  // Produces a small self-contained server in .next/standalone — used by the Dockerfile.
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['postgres'],
  experimental: {
    // Uploads (max 5 MB each) are sent through server actions.
    serverActions: { bodySizeLimit: '6mb' },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    // Old .html URLs from the first version of the portal.
    return [
      { source: '/index.html', destination: '/', permanent: true },
      {
        source: '/:page(marketplace|niches|vendors|track|tools|about|login|register|dashboard).html',
        destination: '/:page',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
