import { ExternalLink } from 'lucide-react';
import { resolveLocale } from '@shared/index';
import { useTranslation } from 'react-i18next';
import { SiteLogo } from './SiteLogo';
import { FACEBOOK_URL, GOOGLE_MAPS_URL, INSTAGRAM_URL } from '@/lib/seo';
import { useCookieConsent } from '@/components/cookies/CookieConsentProvider';
import { useSiteBootstrap } from '@/hooks/use-site-data';
import { fallbackSiteSettings } from '@/lib/site-settings';
import { LocalizedLink } from '@/components/LocalizedLink';
import { VenueMapWidget } from '@/components/VenueMapWidget';

const footerLinks = [
  { key: 'about', to: '/about' },
  { key: 'menu', to: '/menu' },
  { key: 'events', to: '/events' },
  { key: 'media', to: '/media' },
  { key: 'faq', to: '/faq' },
] as const;

export const Footer = () => {
  const { t, i18n } = useTranslation();
  const { openPreferences } = useCookieConsent();
  const locale = resolveLocale(i18n.language);
  const { data: bootstrap } = useSiteBootstrap(locale);
  const settings = bootstrap?.settings ?? fallbackSiteSettings;
  const year = new Date().getFullYear();

  return (
    <footer className="page-gutter section-space-tight">
      <div className="page-width surface-footer relative overflow-hidden rounded-[2rem] grain-overlay shadow-[var(--shadow-premium)]">
        <div className="grid gap-7 px-5 py-7 sm:px-8 sm:py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-9">
          <div className="max-w-2xl">
            <SiteLogo variant="footer" />
            <h2 className="headline-sea mt-5 font-display text-[2.4rem] leading-[0.9] text-[hsl(var(--text-on-dark))] sm:text-[3rem]">{t('brand.tagline')}</h2>
            <p className="copy-marine mt-4 max-w-[34rem] font-body text-[0.95rem] leading-8 text-white/82">{t('brand.intro')}</p>
            <p className="mt-4 max-w-[30rem] font-body text-[0.9rem] leading-7 text-white/66">{locale === 'hr' ? 'Cocktail bar i caffe bar na samoj rivi u Tribunju, za jutarnju kavu, sunset aperitivo i večeri uz more.' : 'A cocktail bar and coffee bar on the Tribunj waterfront for morning coffee, sunset aperitivo, and evenings by the sea.'}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LocalizedLink to="/reservation" className="luxury-button-primary">{t('hero.cta_reserve')}</LocalizedLink>
              <LocalizedLink to="/events" className="luxury-button-secondary">{t('hero.cta_events')}</LocalizedLink>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="section-kicker">{t('visit.title')}</p>
              <div className="mt-4 space-y-2 font-body text-sm text-white/82">
                <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="block transition hover:text-white"><p>{settings.address}</p><p>{settings.city}</p></a>
                <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="block pt-1 transition hover:text-white">{settings.phone}</a>
                <a href={`mailto:${settings.email}`} className="block transition hover:text-white">{settings.email}</a>
              </div>
              <VenueMapWidget locale={locale} settings={settings} compact className="mt-5" />
              <div className="mt-4 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.18em] text-white/58">
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-white">Instagram <ExternalLink className="h-3 w-3" /></a>
                <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-white">Facebook <ExternalLink className="h-3 w-3" /></a>
                <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-white">Google reviews <ExternalLink className="h-3 w-3" /></a>
              </div>
            </div>
            <div>
              <p className="section-kicker">{t('nav.home')}</p>
              <div className="mt-4 grid gap-2">
                {footerLinks.map((link) => <LocalizedLink key={link.key} to={link.to} className="font-body text-sm text-white/82 transition hover:text-white">{t(`nav.${link.key}`)}</LocalizedLink>)}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-3 text-[11px] text-white/56 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p>© {year}. {t('footer.rights')}</p>
              <div className="space-y-0.5 text-[10px] uppercase tracking-[0.18em] text-white/42">
                <p>Ugostiteljski obrt Tre bocconi | Vl. Irena Cvitan | OIB: 27166402638</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <LocalizedLink to="/privacy" className="transition hover:text-white">{t('footer.privacy')}</LocalizedLink>
              <LocalizedLink to="/terms" className="transition hover:text-white">{t('footer.terms')}</LocalizedLink>
              <LocalizedLink to="/cookies" className="transition hover:text-white">{t('footer.cookies')}</LocalizedLink>
              <button type="button" onClick={openPreferences} className="transition hover:text-white">
                {t('cookie_settings.trigger')}
              </button>
              <a
                href="https://marketeragency.hr"
                target="_blank"
                rel="noreferrer"
                aria-label="Website by marketeragency.hr, made by Mateo Nikolic"
                className="group relative overflow-hidden rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/46 transition hover:border-white/20 hover:text-white/78"
              >
                <span className="block transition duration-300 group-hover:-translate-y-5 group-hover:opacity-0 group-focus-visible:-translate-y-5 group-focus-visible:opacity-0">
                  by marketeragency.hr
                </span>
                <span className="absolute inset-0 flex items-center justify-center px-3 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  Mateo Nikolic
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
