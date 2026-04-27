import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '@/components/cookies/CookieConsentProvider';

export const CookieConsentBanner = () => {
  const { t } = useTranslation();
  const { ready, hasDecision, acceptAll, rejectOptional, openPreferences } = useCookieConsent();

  if (!ready || hasDecision) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] px-2 pb-2 sm:px-5 sm:pb-5">
      <div className="pointer-events-auto mx-auto max-w-5xl overflow-hidden rounded-[1.45rem] border border-white/10 bg-[rgba(8,14,20,0.94)] shadow-[var(--shadow-premium)] backdrop-blur-xl sm:rounded-[1.9rem]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,210,140,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(73,145,179,0.12),transparent_34%)]"
        />
        <div className="relative grid gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
          <div>
            <p className="section-kicker">{t('cookie_consent.eyebrow')}</p>
            <h2 className="mt-2.5 max-w-[14ch] font-display text-[1.65rem] leading-[0.95] text-[hsl(var(--text-on-image))] sm:mt-3 sm:text-[2.2rem] lg:text-[2.45rem]">
              {t('cookie_consent.title')}
            </h2>
            <p className="mt-3 max-w-3xl font-body text-[0.87rem] leading-6 text-white/80 sm:mt-4 sm:text-[0.96rem] sm:leading-7">
              {t('cookie_consent.body')}
            </p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <button type="button" onClick={acceptAll} className="luxury-button-primary min-h-[2.9rem] justify-center px-4 py-3 text-[9px] tracking-[0.22em] sm:min-h-[3.1rem] sm:px-5 sm:text-[10px]">
              {t('cookie_consent.accept_all')}
            </button>
            <button type="button" onClick={rejectOptional} className="luxury-button-secondary min-h-[2.9rem] justify-center border-white/14 bg-white/[0.04] px-4 py-3 text-[9px] tracking-[0.22em] text-white sm:min-h-[3.1rem] sm:px-5 sm:text-[10px]">
              {t('cookie_consent.reject_optional')}
            </button>
            <button type="button" onClick={openPreferences} className="inline-flex min-h-[2.9rem] items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 font-body text-[9px] uppercase tracking-[0.22em] text-white/84 transition hover:bg-white/[0.08] sm:min-h-[3.1rem] sm:px-5 sm:text-[10px]">
              <Settings2 className="h-3.5 w-3.5 text-[hsl(var(--brand-gold))]" />
              {t('cookie_consent.customize')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
