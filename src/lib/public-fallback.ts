import type { BootstrapPayload, SiteSettingsDTO } from '@shared/index';

export const fallbackSiteSettings: SiteSettingsDTO = {
  businessName: 'Nautica',
  timezone: 'Europe/Zagreb',
  phone: '+385 99 785 6785',
  whatsappPhone: '+385 99 785 6785',
  email: 'trebocconi@trebocconi.com',
  address: 'DONJA RIVA 55',
  city: '22212 Tribunj, Croatia',
};

export const buildFallbackBootstrap = (locale: 'hr' | 'en'): BootstrapPayload => ({
  locale,
  fallbackLocale: locale === 'hr' ? 'en' : 'hr',
  generatedAt: new Date(0).toISOString(),
  settings: fallbackSiteSettings,
  menu: [],
  featuredEvents: [],
  announcements: [],
  glimpses: [],
  mediaCollections: [],
});
