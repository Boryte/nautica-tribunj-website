import type { EventDTO, FaqEntryDTO, LocaleCode, MenuItemDTO, SiteSettingsDTO } from '@shared/index';
import { localizePath, stripLocalePrefix } from '@/lib/locale-routing';
import { siteAsset } from '@/lib/site-asset-paths';

export const SITE_NAME = 'Nautica';
const FALLBACK_SITE_URL = 'https://nautica.hr';

const normalizeSiteUrl = (value?: string | null) => {
  if (!value) return '';
  return value.trim().replace(/\/$/, '').replace(/\/+$/, '');
};

const resolveSiteUrl = () => {
  const configuredUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
  if (configuredUrl) return configuredUrl;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeSiteUrl(window.location.origin) || FALLBACK_SITE_URL;
  }

  return FALLBACK_SITE_URL;
};

export const SITE_URL = resolveSiteUrl();
export const DEFAULT_OG_IMAGE = `${SITE_URL}${siteAsset('hero-sunset.jpg')}`;
export const DEFAULT_LOGO_URL = `${SITE_URL}${siteAsset('logo-clean.png')}`;
export const INSTAGRAM_URL = 'https://www.instagram.com/nautica_tribunj/';
export const FACEBOOK_URL = 'https://www.facebook.com/nauticatribunj';
export const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/3aQ3LYZFjtyszyQD9';

export const DEFAULT_SEO_SETTINGS: SiteSettingsDTO = {
  businessName: SITE_NAME,
  timezone: 'Europe/Zagreb',
  phone: '+385 99 785 6785',
  whatsappPhone: '+385 99 785 6785',
  email: 'trebocconi@trebocconi.com',
  address: 'DONJA RIVA 55',
  city: '22212 Tribunj, Croatia',
};

export const normalizePath = (value: string) => {
  if (!value) return '/';
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    return `${url.pathname}${url.search}${url.hash}` || '/';
  }
  return value.startsWith('/') ? value : `/${value}`;
};

export const toAbsoluteUrl = (value: string) => {
  if (!value) return SITE_URL;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

export const toLocalizedUrl = (value: string, locale: LocaleCode) => {
  const normalized = stripLocalePrefix(normalizePath(value));
  return toAbsoluteUrl(localizePath(normalized, locale));
};

export const localeToOgLocale = (locale: LocaleCode) => (locale === 'hr' ? 'hr_HR' : 'en_GB');

export const openingHoursSpecification = [
  { dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '08:00', closes: '00:00' },
  { dayOfWeek: 'Friday', opens: '08:00', closes: '01:00' },
  { dayOfWeek: 'Saturday', opens: '09:00', closes: '01:00' },
  { dayOfWeek: 'Sunday', opens: '09:00', closes: '01:00' },
].map((entry) => ({
  '@type': 'OpeningHoursSpecification',
  ...entry,
}));

export const openingHoursText = [
  'Mo-Th 08:00-00:00',
  'Fr 08:00-01:00',
  'Sa-Su 09:00-01:00',
];

export const buildOrganizationSchema = (settings: SiteSettingsDTO = DEFAULT_SEO_SETTINGS) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: settings.businessName,
  url: SITE_URL,
  logo: DEFAULT_LOGO_URL,
  image: [
    DEFAULT_OG_IMAGE,
    `${SITE_URL}${siteAsset('coffee-morning.jpg')}`,
    `${SITE_URL}${siteAsset('sunset-cocktails.jpg')}`,
  ],
  email: settings.email,
  telephone: settings.phone,
  legalName: 'Ugostiteljski obrt Tre bocconi',
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', telephone: settings.phone, email: settings.email, availableLanguage: ['hr', 'en'], areaServed: 'HR' }],
  sameAs: [INSTAGRAM_URL, FACEBOOK_URL, GOOGLE_MAPS_URL],
});

export const buildLocalBusinessSchema = (
  locale: LocaleCode,
  settings: SiteSettingsDTO = DEFAULT_SEO_SETTINGS,
) => ({
  '@context': 'https://schema.org',
  '@type': ['BarOrPub', 'CafeOrCoffeeShop'],
  '@id': `${SITE_URL}/#localbusiness`,
  name: settings.businessName,
  url: SITE_URL,
  image: [
    DEFAULT_OG_IMAGE,
    `${SITE_URL}${siteAsset('gallery-aerial.jpg')}`,
    `${SITE_URL}${siteAsset('sunset-cocktails.jpg')}`,
  ],
  logo: DEFAULT_LOGO_URL,
  description:
    locale === 'hr'
      ? 'Nautica je cocktail bar i caffe bar na rivi u Tribunju, poznat po signature koktelima, biranoj kavi, zalascima sunca i večerima uz more.'
      : 'Nautica is a seafront cocktail bar and coffee bar in Tribunj, known for signature cocktails, curated coffee, sunsets, and evenings by the Adriatic.',
  telephone: settings.phone,
  email: settings.email,
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Cash, Card',
  servesCuisine: ['Cocktails', 'Coffee', 'Mediterranean bar service'],
  menu: `${SITE_URL}/menu`,
  acceptsReservations: true,
  hasMap: GOOGLE_MAPS_URL,
  publicAccess: true,
  potentialAction: { '@type': 'ReserveAction', target: toLocalizedUrl('/reservation', locale) },
  sameAs: [INSTAGRAM_URL, FACEBOOK_URL, GOOGLE_MAPS_URL],
  address: {
    '@type': 'PostalAddress',
    streetAddress: settings.address,
    addressLocality: 'Tribunj',
    postalCode: '22212',
    addressCountry: 'HR',
  },
  areaServed: [
    { '@type': 'City', name: 'Tribunj' },
    { '@type': 'City', name: 'Vodice' },
    { '@type': 'City', name: 'Srima' },
    { '@type': 'AdministrativeArea', name: 'Šibenik-Knin County' },
  ],
  openingHours: openingHoursText,
  openingHoursSpecification,
  slogan: locale === 'hr' ? 'Kava, kokteli i večeri uz more u Tribunju.' : 'Coffee, cocktails, and evenings by the sea in Tribunj.',
  keywords:
    locale === 'hr'
      ? 'cocktail bar Tribunj, caffe bar Tribunj, kokteli Tribunj, kava Tribunj, bar uz more Tribunj, bar blizu Vodica, sunset bar Srima'
      : 'cocktail bar Tribunj, coffee bar Tribunj, seafront bar Tribunj, cocktails Tribunj, coffee Tribunj, bar near Vodice, sunset bar Srima',
});

export const buildWebsiteSchema = (locale: LocaleCode) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: locale,
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: { '@type': 'ReserveAction', target: toLocalizedUrl('/reservation', locale), name: locale === 'hr' ? 'Rezervirajte stol' : 'Reserve a table' },
});

export const buildBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const buildWebPageSchema = ({
  locale,
  title,
  description,
  url,
}: {
  locale: LocaleCode;
  title: string;
  description: string;
  url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${url}#webpage`,
  url,
  name: title,
  description,
  inLanguage: locale,
  isPartOf: { '@id': `${SITE_URL}/#website` },
  about: { '@id': `${SITE_URL}/#localbusiness` },
});

export const buildFaqSchema = (faqs: FaqEntryDTO[], locale: LocaleCode, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${url}#faq`,
  url,
  inLanguage: locale,
  mainEntity: faqs.map((entry) => ({
    '@type': 'Question',
    name: entry.localizations[locale].question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: entry.localizations[locale].answer,
    },
  })),
});

export const buildEventsCollectionSchema = (events: EventDTO[], locale: LocaleCode, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${url}#collection`,
  url,
  inLanguage: locale,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/events/${event.slug}`,
      name: event.localizations[locale].title,
    })),
  },
});

export const buildEventSchema = (event: EventDTO, locale: LocaleCode, settings: SiteSettingsDTO = DEFAULT_SEO_SETTINGS) => {
  const eventUrl = `${SITE_URL}/events/${event.slug}`;
  const image = event.gallery[0]?.url ?? event.imageUrl ?? DEFAULT_OG_IMAGE;
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${eventUrl}#event`,
    name: event.localizations[locale].title,
    description: event.localizations[locale].description || event.localizations[locale].teaser,
    startDate: event.startsAt,
    endDate: event.endsAt ?? undefined,
    eventStatus: event.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [toAbsoluteUrl(image)],
    url: eventUrl,
    location: {
      '@type': 'Place',
      name: settings.businessName,
      sameAs: GOOGLE_MAPS_URL,
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.address,
        addressLocality: 'Tribunj',
        postalCode: '22212',
        addressCountry: 'HR',
      },
    },
    organizer: {
      '@id': `${SITE_URL}/#organization`,
    },
    offers: event.ticketUrl
      ? {
          '@type': 'Offer',
          url: event.ticketUrl,
          availability: event.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
          priceCurrency: 'EUR',
          price: event.priceLabel?.replace(/[^\d.,]/g, '').replace(',', '.') || '0',
        }
      : undefined,
  };
};

export const buildImageGallerySchema = ({
  locale,
  url,
  title,
  description,
  images,
}: {
  locale: LocaleCode;
  url: string;
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${url}#gallery`,
  url,
  name: title,
  description,
  inLanguage: locale,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: images.slice(0, 24).map((image, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'ImageObject',
        contentUrl: toAbsoluteUrl(image.url),
        name: image.alt,
      },
    })),
  },
});


export const buildMenuSchema = ({
  locale,
  url,
  menuItems,
}: {
  locale: LocaleCode;
  url: string;
  menuItems: MenuItemDTO[];
}) => {
  const sections = new Map<string, MenuItemDTO[]>();

  for (const item of menuItems) {
    const group = sections.get(item.category) ?? [];
    group.push(item);
    sections.set(item.category, group);
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${url}#menu`,
    name: locale === 'hr' ? 'Nautica meni' : 'Nautica menu',
    hasMenuSection: Array.from(sections.entries()).map(([category, items]) => ({
      '@type': 'MenuSection',
      name: category.replace(/_/g, ' '),
      hasMenuItem: items.slice(0, 24).map((item) => ({
        '@type': 'MenuItem',
        name: item.localizations[locale].name,
        description: item.localizations[locale].description,
        offers: item.priceLabel
          ? {
              '@type': 'Offer',
              priceCurrency: 'EUR',
              price: item.priceLabel.replace(/[^\d.,]/g, '').replace(',', '.') || undefined,
            }
          : undefined,
      })),
    })),
  };
};
