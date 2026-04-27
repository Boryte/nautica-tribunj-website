import { QueryClient, dehydrate } from '@tanstack/react-query';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom/server';
import type { LocaleCode } from '@shared/index';
import { AppShell, createAppQueryClient } from '@/App';
import i18n from '@/i18n';
import { getBootstrapPayload } from '../apps/api/src/services/content-service';
import { listPublicEvents, getEventBySlug } from '../apps/api/src/services/event-service';
import { listActiveAnnouncements } from '../apps/api/src/services/announcement-service';
import { listGalleryCollections } from '../apps/api/src/services/media-service';
import { listFaqEntries } from '../apps/api/src/services/faq-service';
import { getSocialFeed } from '../apps/api/src/services/social-feed-service';
import { getPathLocale, stripLocalePrefix } from '@/lib/locale-routing';
import { siteMedia } from '@/lib/site-media';

const publicEvents = () => listPublicEvents();

type PrerenderEntry = { path: string; images?: string[] };
type HelmetChunk = { toString: () => string };
type HelmetContextShape = {
  helmet?: {
    title?: HelmetChunk;
    priority?: HelmetChunk;
    meta?: HelmetChunk;
    link?: HelmetChunk;
    script?: HelmetChunk;
    htmlAttributes?: HelmetChunk;
    bodyAttributes?: HelmetChunk;
  };
};

const buildLocalizedEntries = (basePath: string, images?: string[]) => [
  { path: basePath, images },
  { path: `/en${basePath === '/' ? '' : basePath}`, images },
] satisfies PrerenderEntry[];

export const getPrerenderEntries = async (): Promise<PrerenderEntry[]> => {
  const events = publicEvents();
  return [
    ...buildLocalizedEntries('/', [siteMedia.hero.src]),
    ...buildLocalizedEntries('/about', [siteMedia.about.src]),
    ...buildLocalizedEntries('/menu', [siteMedia.cocktails.src]),
    ...buildLocalizedEntries('/events', [siteMedia.events.src]),
    ...buildLocalizedEntries('/reservation', [siteMedia.hero.src]),
    ...buildLocalizedEntries('/media', [siteMedia.gallery.src]),
    ...buildLocalizedEntries('/faq', [siteMedia.about.src]),
    ...buildLocalizedEntries('/privacy', [siteMedia.gallery.src]),
    ...buildLocalizedEntries('/terms', [siteMedia.gallery.src]),
    ...buildLocalizedEntries('/cookies', [siteMedia.gallery.src]),
    ...events.flatMap((event) => buildLocalizedEntries(`/events/${event.slug}`, [event.gallery[0]?.url ?? event.imageUrl ?? siteMedia.events.src])),
  ];
};

const seedCommonQueries = async (queryClient: QueryClient, locale: LocaleCode) => {
  const events = publicEvents();
  const featuredEvents = events.filter((event) => event.featured);
  const bootstrap = getBootstrapPayload(locale, featuredEvents);
  queryClient.setQueryData(['bootstrap', locale], bootstrap);
  queryClient.setQueryData(['announcements'], listActiveAnnouncements());
  return { events };
};

const seedRouteQueries = async (queryClient: QueryClient, url: string, locale: LocaleCode) => {
  const parsedUrl = new URL(url, 'https://nautica.hr');
  const pathname = stripLocalePrefix(parsedUrl.pathname);
  const { events } = await seedCommonQueries(queryClient, locale);

  if (pathname === '/') queryClient.setQueryData(['social-feed'], await getSocialFeed());
  if (pathname === '/events') queryClient.setQueryData(['events'], events);
  if (pathname.startsWith('/events/')) {
    const parts = pathname.split('/').filter(Boolean);
    const slug = parts[parts.length - 1] ?? ''; 
    if (slug) queryClient.setQueryData(['event', slug], getEventBySlug(slug));
  }
  if (pathname === '/media' || pathname === '/gallery') queryClient.setQueryData(['gallery'], listGalleryCollections({ readyOnly: true }));
  if (pathname === '/faq') queryClient.setQueryData(['faqs'], listFaqEntries(true));
};

export const render = async (url: string) => {
  const parsedUrl = new URL(url, 'https://nautica.hr');
  const locale = getPathLocale(parsedUrl.pathname, parsedUrl.search);
  await i18n.changeLanguage(locale);

  const queryClient = createAppQueryClient();
  await seedRouteQueries(queryClient, url, locale);
  const dehydratedState = dehydrate(queryClient);
  const helmetContext: HelmetContextShape = {};

  const appHtml = renderToString(
    <HelmetProvider context={helmetContext}>
      <AppShell
        dehydratedState={dehydratedState}
        initialQueryClient={queryClient}
        isPrerenderMode={false}
        renderRouter={(children) => <StaticRouter location={url}>{children}</StaticRouter>}
      />
    </HelmetProvider>,
  );

  const helmet = helmetContext.helmet;
  return {
    appHtml,
    dehydratedState,
    head: (helmet?.title?.toString() ?? '') + (helmet?.priority?.toString() ?? '') + (helmet?.meta?.toString() ?? '') + (helmet?.link?.toString() ?? '') + (helmet?.script?.toString() ?? ''),
    htmlAttributes: helmet?.htmlAttributes?.toString() ?? '',
    bodyAttributes: helmet?.bodyAttributes?.toString() ?? '',
  };
};
