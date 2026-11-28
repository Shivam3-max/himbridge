import type { MetadataRoute } from 'next';

// Rendered per request so the live APP_URL (not the build machine's) is used.
export const dynamic = 'force-dynamic';

const PUBLIC_PAGES = [
  '',
  '/solutions/brands',
  '/solutions/designers',
  '/solutions/importers',
  '/export-ready',
  '/marketplace',
  '/niches',
  '/vendors',
  '/track',
  '/tools',
  '/about',
  '/login',
  '/register',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return PUBLIC_PAGES.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === '' || path === '/marketplace' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
