import { useEffect, useState } from 'react';
import { resolveLocale } from '@shared/index';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActiveAnnouncements } from '@/hooks/use-site-data';
import { setHeaderHeightVar, usePublicOverlay } from '@/lib/public-ui';
import { AnnouncementBar } from './AnnouncementBar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SiteLogo } from './SiteLogo';
import { LocalizedLink } from '@/components/LocalizedLink';
import { stripLocalePrefix } from '@/lib/locale-routing';

const navKeys = ['about', 'menu', 'events', 'reservation', 'media', 'faq'] as const;
const navPaths: Record<(typeof navKeys)[number], string> = { about: '/about', menu: '/menu', events: '/events', reservation: '/reservation', media: '/media', faq: '/faq' };

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const locale = resolveLocale(i18n.language);
  const basePathname = stripLocalePrefix(location.pathname);
  const { data: announcements = [] } = useActiveAnnouncements();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  usePublicOverlay('mobile-menu', mobileOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.header-frame');
    if (!header) return;
    const updateHeight = () => setHeaderHeightVar(header.getBoundingClientRect().height + 20);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    window.addEventListener('resize', updateHeight, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [announcements.length, mobileOpen]);

  return (
    <>
      <div className="header-shell">
        <motion.div initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }} className={`header-frame ${scrolled || mobileOpen ? 'header-frame-solid' : ''}`}>
          <AnnouncementBar announcements={announcements} locale={locale} />
          <div className="nav-shell">
            <SiteLogo variant="header" />
            <nav className="hidden items-center gap-6 lg:flex">
              {navKeys.map((key) => {
                const active = basePathname === navPaths[key] || (key === 'events' && basePathname.startsWith('/events/'));
                return <LocalizedLink key={key} to={navPaths[key]} className={`nav-link ${active ? 'nav-link-active' : ''}`}>{t(`nav.${key}`)}</LocalizedLink>;
              })}
            </nav>
            <div className="hidden items-center gap-3 lg:flex">
              <LanguageSwitcher />
              <LocalizedLink to="/reservation" className="luxury-button-primary">{t('hero.cta_reserve')}</LocalizedLink>
            </div>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white transition hover:bg-white/[0.08] lg:hidden" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileOpen((current) => !current)}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] bg-[rgba(6,10,15,0.5)] px-4 py-6 backdrop-blur-md lg:hidden" aria-modal="true" role="dialog" onClick={() => setMobileOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} onClick={(event) => event.stopPropagation()} className="mx-auto mt-16 flex max-h-[min(82svh,44rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.6rem] border border-black/10 bg-[linear-gradient(180deg,rgba(246,239,228,0.98),rgba(236,226,210,0.98))] text-[hsl(var(--text-inverse))] shadow-[var(--shadow-premium)]">
              <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
                <div className="flex flex-col">
                  <SiteLogo variant="compact" />
                  <span className="mt-4 font-display text-[2rem] leading-[0.94] text-[hsl(var(--text-inverse))]">{t('nav.home')}</span>
                </div>
                <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-black/0 text-[hsl(var(--text-inverse))]/90 transition hover:bg-black/5 hover:text-[hsl(var(--text-inverse))]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
                <div className="grid gap-1">
                  {navKeys.map((key) => <LocalizedLink key={key} to={navPaths[key]} className="py-2 font-body text-[1.05rem] leading-8 text-[hsl(var(--text-inverse))] transition hover:text-[hsl(var(--brand-gold))]">{t(`nav.${key}`)}</LocalizedLink>)}
                </div>
              
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-black/10 px-5 py-4 sm:px-6">
                <LanguageSwitcher />
                <LocalizedLink to="/reservation" className="luxury-button-primary">{t('hero.cta_reserve')}</LocalizedLink>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};
