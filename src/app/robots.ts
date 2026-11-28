import type { MetadataRoute } from 'next';

// Rendered per request so the live APP_URL (not the build machine's) is used.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/documents', '/files', '/api'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
