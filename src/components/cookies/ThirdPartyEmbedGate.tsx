import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '@/components/cookies/CookieConsentProvider';
import type { CookieConsentCategory } from '@/lib/cookie-consent';
import { cn } from '@/lib/utils';

export const ThirdPartyEmbedGate = ({
  category,
  title,
  body,
  className,
  children,
  preview,
}: {
  category: CookieConsentCategory;
  title: string;
  body: string;
  className?: string;
  children: ReactNode;
  preview?: ReactNode;
}) => {
  const { t } = useTranslation();
  const { canUse, savePreferences, openPreferences } = useCookieConsent();

  if (canUse(category)) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[rgba(8,14,20,0.78)]', className)}>
      {preview ? <div aria-hidden="true" className="absolute inset-0 opacity-30 blur-[2px]">{preview}</div> : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,20,0.2),rgba(8,14,20,0.88))]" />
      <div className="relative flex min-h-[inherit] flex-col items-start justify-end p-5 sm:p-6">
        <div className="rounded-full border border-[hsl(var(--brand-gold))]/25 bg-[hsl(var(--brand-gold))]/10 p-3">
          <ShieldCheck className="h-5 w-5 text-[hsl(var(--brand-gold))]" />
        </div>
        <p className="mt-5 font-display text-[2rem] leading-[0.94] text-[hsl(var(--text-on-image))]">
          {title}
        </p>
        <p className="mt-3 max-w-2xl font-body text-sm leading-7 text-white/78">
          {body}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => savePreferences({ [category]: true })}
            className="luxury-button-primary justify-center"
          >
            {t('cookie_gate.allow_and_load')}
          </button>
          <button
            type="button"
            onClick={openPreferences}
            className="luxury-button-secondary justify-center border-white/14 bg-white/[0.04] text-white"
          >
            {t('cookie_gate.open_settings')}
          </button>
        </div>
      </div>
    </div>
  );
};
