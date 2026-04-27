import { useEffect, useMemo, useState } from 'react';
import { LocalizedLink } from '@/components/LocalizedLink';
import type { AnnouncementDTO, LocaleCode } from '@shared/index';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

const getHref = (announcement: AnnouncementDTO) => {
  if (announcement.ctaUrl) return announcement.ctaUrl;
  if (announcement.eventId) return '/events';
  if (announcement.reservationIntent) return `/reservation?intent=${announcement.reservationIntent}`;
  return null;
};

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

export const AnnouncementBar = ({
  announcements,
  locale,
}: {
  announcements: AnnouncementDTO[];
  locale: LocaleCode;
}) => {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const stored = window.localStorage.getItem('nautica-dismissed-announcements');
    if (stored) setDismissed(JSON.parse(stored));
  }, []);

  const visibleAnnouncements = useMemo(
    () =>
      announcements.filter(
        (announcement) =>
          !announcement.dismissible ||
          !announcement.persistentDismissalKey ||
          !dismissed.includes(announcement.persistentDismissalKey)
      ),
    [announcements, dismissed]
  );

  useEffect(() => {
    if (visibleAnnouncements.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % visibleAnnouncements.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [visibleAnnouncements.length]);

  useEffect(() => {
    if (!visibleAnnouncements.length) return;
    setIndex((current) => Math.min(current, visibleAnnouncements.length - 1));
  }, [visibleAnnouncements.length]);

  if (!visibleAnnouncements.length) return null;

  const active = visibleAnnouncements[index % visibleAnnouncements.length];
  const href = getHref(active);
  const fallbackLabel = locale === 'hr' ? 'Otvori' : 'Open';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active.id}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.28 }}
        className="announcement-shell"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-kicker">{active.variant}</span>
            <span className="hidden font-body text-[10px] uppercase tracking-[0.24em] text-white/78 sm:inline">
              {active.localizations[locale].title}
            </span>
          </div>
          <p className="announcement-copy truncate">{active.localizations[locale].body}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {href
            ? isExternalHref(href)
              ? (
                <a href={href} target="_blank" rel="noreferrer" className="luxury-button-ghost whitespace-nowrap">
                  {active.localizations[locale].ctaLabel || fallbackLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )
              : (
                <LocalizedLink to={href} className="luxury-button-ghost whitespace-nowrap">
                  {active.localizations[locale].ctaLabel || fallbackLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </LocalizedLink>
              )
            : null}
          {active.dismissible && active.persistentDismissalKey ? (
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => {
                const next = [...dismissed, active.persistentDismissalKey!];
                setDismissed(next);
                window.localStorage.setItem('nautica-dismissed-announcements', JSON.stringify(next));
              }}
              className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/88 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
