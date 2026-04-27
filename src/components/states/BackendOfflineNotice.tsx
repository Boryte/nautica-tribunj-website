import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BackendOfflineNotice = ({
  title,
  body,
  compact = false,
  className = '',
}: {
  title?: string;
  body?: string;
  compact?: boolean;
  className?: string;
}) => {
  const { i18n } = useTranslation();
  const locale = i18n.language.startsWith('hr') ? 'hr' : 'en';

  const resolvedTitle = title ?? (locale === 'hr' ? 'Backend je trenutno offline.' : 'The backend is currently offline.');
  const resolvedBody = body ?? (
    locale === 'hr'
      ? 'Stranica i dalje radi, ali sadržaj koji traži server trenutno nije dostupan. Pokušajte ponovno uskoro.'
      : 'The page still works, but content that depends on the server is currently unavailable. Please try again shortly.'
  );

  return (
    <div className={`rounded-[1.6rem] border border-amber-500/18 bg-[linear-gradient(180deg,rgba(255,250,240,0.92),rgba(248,239,223,0.92))] p-5 text-[hsl(var(--text-inverse))] shadow-[0_24px_54px_-42px_rgba(120,84,17,0.4)] ${className}`}>
      <div className={`flex ${compact ? 'items-start gap-3' : 'flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'}`}>
        <div className="flex gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--brand-gold))]/18 text-[hsl(var(--brand-gold))]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-[1.45rem] leading-[0.96] text-[hsl(var(--text-inverse))]">{resolvedTitle}</p>
            <p className="mt-2 max-w-2xl font-body text-sm leading-7 text-[hsl(var(--text-body))]/80">{resolvedBody}</p>
          </div>
        </div>
        {!compact ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/45 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--text-body))]/72">
            <RefreshCw className="h-3.5 w-3.5" />
            {locale === 'hr' ? 'Frontend fallback' : 'Frontend fallback'}
          </div>
        ) : null}
      </div>
    </div>
  );
};
