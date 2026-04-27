import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '@/components/cookies/CookieConsentProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const preferenceKeys = ['preferences', 'analytics', 'marketing'] as const;

export const CookiePreferencesDialog = () => {
  const { t } = useTranslation();
  const {
    ready,
    preferences,
    preferencesOpen,
    closePreferences,
    savePreferences,
    rejectOptional,
    acceptAll,
  } = useCookieConsent();
  const [draft, setDraft] = useState(preferences);

  useEffect(() => {
    if (preferencesOpen) {
      setDraft(preferences);
    }
  }, [preferences, preferencesOpen]);

  if (!ready) return null;

  return (
    <Dialog open={preferencesOpen} onOpenChange={(open) => (open ? undefined : closePreferences())}>
      <DialogContent className="left-1/2 top-auto grid max-h-[calc(100svh-1rem)] w-[calc(100vw-1rem)] max-w-[42rem] translate-x-[-50%] translate-y-0 gap-0 overflow-hidden rounded-[1.4rem] border-white/10 bg-[rgba(8,14,20,0.97)] p-0 text-white shadow-[var(--shadow-premium)] sm:top-[50%] sm:max-h-[88svh] sm:w-[calc(100vw-2rem)] sm:translate-y-[-50%] sm:rounded-[1.65rem]">
        <div className="overflow-hidden rounded-[1.4rem] sm:rounded-[1.65rem]">
          <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
            <DialogHeader className="space-y-3 text-left">
              <p className="section-kicker">{t('cookie_settings.eyebrow')}</p>
              <DialogTitle className="max-w-[13ch] font-display text-[1.7rem] leading-[0.95] text-[hsl(var(--text-on-image))] sm:text-[2rem]">
                {t('cookie_settings.title')}
              </DialogTitle>
              <DialogDescription className="max-w-2xl font-body text-[0.88rem] leading-6 text-white/72 sm:text-sm sm:leading-7">
                {t('cookie_settings.description')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid max-h-[calc(100svh-13rem)] gap-3 overflow-y-auto px-4 py-4 sm:max-h-[56svh] sm:px-6 sm:py-5">
            <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4 sm:rounded-[1.35rem] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <p className="font-display text-[1.35rem] leading-[1] text-[hsl(var(--text-on-image))] sm:text-[1.55rem]">
                    {t('cookie_settings.categories.necessary.title')}
                  </p>
                  <p className="mt-2 max-w-2xl font-body text-[0.88rem] leading-6 text-white/72 sm:text-sm sm:leading-7">
                    {t('cookie_settings.categories.necessary.body')}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-[hsl(var(--brand-gold))]/25 bg-[hsl(var(--brand-gold))]/12 px-3 py-1 font-body text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--brand-gold))] sm:text-[10px]">
                  {t('cookie_settings.always_active')}
                </span>
              </div>
            </div>

            {preferenceKeys.map((key) => (
              <div key={key} className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4 sm:rounded-[1.35rem] sm:p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 max-w-2xl">
                      <p className="font-display text-[1.35rem] leading-[1] text-[hsl(var(--text-on-image))] sm:text-[1.55rem]">
                        {t(`cookie_settings.categories.${key}.title`)}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draft[key]}
                      onClick={() => setDraft((current) => ({ ...current, [key]: !current[key] }))}
                      className={`inline-flex h-10 min-w-[5.1rem] shrink-0 items-center rounded-full border px-1.5 transition ${
                        draft[key]
                          ? 'border-[hsl(var(--brand-gold))]/35 bg-[hsl(var(--brand-gold))]/16'
                          : 'border-white/12 bg-white/[0.03]'
                      }`}
                    >
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-body text-[9px] uppercase tracking-[0.15em] transition ${
                          draft[key]
                            ? 'translate-x-[calc(100%-0.35rem)] bg-[hsl(var(--brand-gold))] text-[hsl(var(--text-inverse))]'
                            : 'translate-x-0 bg-white/[0.08] text-white/66'
                        }`}
                      >
                        {draft[key] ? t('common.on') : t('common.off')}
                      </span>
                    </button>
                  </div>
                  <div className="max-w-2xl">
                    <p className="mt-2 font-body text-[0.88rem] leading-6 text-white/72 sm:text-sm sm:leading-7">
                      {t(`cookie_settings.categories.${key}.body`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="border-t border-white/10 px-4 py-4 sm:px-6 sm:py-5">
            <button type="button" onClick={rejectOptional} className="luxury-button-secondary min-h-[2.9rem] justify-center border-white/14 bg-white/[0.04] px-4 py-3 text-[9px] tracking-[0.22em] text-white sm:px-5 sm:text-[10px]">
              {t('cookie_consent.reject_optional')}
            </button>
            <button type="button" onClick={acceptAll} className="luxury-button-secondary min-h-[2.9rem] justify-center border-white/14 bg-white/[0.04] px-4 py-3 text-[9px] tracking-[0.22em] text-white sm:px-5 sm:text-[10px]">
              {t('cookie_consent.accept_all')}
            </button>
            <button type="button" onClick={() => savePreferences(draft)} className="luxury-button-primary min-h-[2.9rem] justify-center px-4 py-3 text-[9px] tracking-[0.22em] sm:px-5 sm:text-[10px]">
              {t('cookie_settings.save_preferences')}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
