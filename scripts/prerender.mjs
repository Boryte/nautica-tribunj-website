import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer as createViteServer, loadEnv } from 'vite';

const root = process.cwd();
const distDir = path.resolve(root, 'dist');
const env = loadEnv(process.env.NODE_ENV || 'production', root, '');
const normalizeSiteUrl = (value) => (value || '').trim().replace(/\/+$/, '');
const siteUrl = normalizeSiteUrl(env.VITE_SITE_URL || env.FRONTEND_ORIGIN || 'https://nautica.hr');
const siteHost = new URL(siteUrl).host;

const staticConfig = new Map([
  ['/', { priority: '1.0', changefreq: 'daily' }],
  ['/en', { priority: '0.92', changefreq: 'daily' }],
  ['/about', { priority: '0.82', changefreq: 'monthly' }],
  ['/en/about', { priority: '0.74', changefreq: 'monthly' }],
  ['/menu', { priority: '0.94', changefreq: 'weekly' }],
  ['/en/menu', { priority: '0.86', changefreq: 'weekly' }],
  ['/events', { priority: '0.92', changefreq: 'weekly' }],
  ['/en/events', { priority: '0.84', changefreq: 'weekly' }],
  ['/reservation', { priority: '0.9', changefreq: 'weekly' }],
  ['/en/reservation', { priority: '0.82', changefreq: 'weekly' }],
  ['/media', { priority: '0.78', changefreq: 'weekly' }],
  ['/en/media', { priority: '0.7', changefreq: 'weekly' }],
  ['/faq', { priority: '0.74', changefreq: 'monthly' }],
  ['/en/faq', { priority: '0.66', changefreq: 'monthly' }],
  ['/privacy', { priority: '0.32', changefreq: 'yearly' }],
  ['/en/privacy', { priority: '0.28', changefreq: 'yearly' }],
  ['/terms', { priority: '0.32', changefreq: 'yearly' }],
  ['/en/terms', { priority: '0.28', changefreq: 'yearly' }],
  ['/cookies', { priority: '0.34', changefreq: 'yearly' }],
  ['/en/cookies', { priority: '0.3', changefreq: 'yearly' }],
]);

const ensureRouteDirectory = async (routePath) => {
  const normalized = routePath.replace(/^\//, '');
  const directory = normalized ? path.join(distDir, normalized) : distDir;
  await fs.mkdir(directory, { recursive: true });
  return directory;
};

const normalizeAlternatePath = (routePath, locale) => {
  const isEnglish = routePath === '/en' || routePath.startsWith('/en/');
  const basePath = isEnglish ? routePath.slice(3) || '/' : routePath;
  return locale === 'en' ? (basePath === '/' ? '/en' : `/en${basePath}`) : basePath;
};

const buildSitemap = (routes) => {
  const stamp = new Date().toISOString();
  const items = routes.map(({ path: routePath, priority, changefreq, images = [] }) => {
    const hrHref = `${siteUrl}${normalizeAlternatePath(routePath, 'hr')}`;
    const enHref = `${siteUrl}${normalizeAlternatePath(routePath, 'en')}`;
    const imageTags = images.filter(Boolean).slice(0, 8).map((imageUrl) => `    <image:image>\n      <image:loc>${imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`}</image:loc>\n    </image:image>`).join('\n');
    return `  <url>\n    <loc>${siteUrl}${routePath}</loc>\n    <lastmod>${stamp}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n    <xhtml:link rel="alternate" hreflang="hr" href="${hrHref}" />\n    <xhtml:link rel="alternate" hreflang="en" href="${enHref}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${hrHref}" />${imageTags ? `\n${imageTags}` : ''}\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${items}\n</urlset>\n`;
};

const injectRenderedDocument = (template, { appHtml, dehydratedState, head, htmlAttributes, bodyAttributes }) => {
  const htmlOpen = `<html${htmlAttributes ? ` ${htmlAttributes}` : ''}>`;
  const bodyOpen = `<body${bodyAttributes ? ` ${bodyAttributes}` : ''}>`;
  const stateScript = `<script>window.__REACT_QUERY_DEHYDRATED_STATE__=${JSON.stringify(dehydratedState).replace(/</g, '\\u003c')};</script>`;
  const seoInjected = template.includes('<!--app-seo:start-->')
    ? template.replace(/<!--app-seo:start-->[\s\S]*?<!--app-seo:end-->/i, head)
    : template.replace('</head>', `${head}\n</head>`);

  return seoInjected
    .replace(/<html[^>]*>/i, htmlOpen)
    .replace(/<body[^>]*>/i, bodyOpen)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>\n    ${stateScript}`);
};

const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${siteUrl}/sitemap.xml\nHost: ${siteHost}\n`;

const main = async () => {
  const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  const vite = await createViteServer({ root, appType: 'custom', server: { middlewareMode: true } });
  try {
    const entryServer = await vite.ssrLoadModule('/src/entry-server.tsx');
    const routeEntries = await entryServer.getPrerenderEntries();
    const routes = routeEntries.map((entry) => ({ path: entry.path, images: entry.images ?? [], priority: staticConfig.get(entry.path)?.priority ?? '0.8', changefreq: staticConfig.get(entry.path)?.changefreq ?? 'weekly' }));
    for (const route of routes) {
      const rendered = await entryServer.render(route.path);
      const outDir = await ensureRouteDirectory(route.path);
      await fs.writeFile(path.join(outDir, 'index.html'), injectRenderedDocument(template, rendered), 'utf8');
    }
    await fs.writeFile(path.join(distDir, 'spa.html'), template, 'utf8');
    await fs.writeFile(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
    await fs.writeFile(path.join(distDir, 'sitemap.xml'), buildSitemap(routes), 'utf8');
  } finally {
    await vite.close();
  }
};

main().catch((error) => {
  console.error('[prerender] Failed to generate static routes.');
  console.error(error);
  process.exit(1);
});
