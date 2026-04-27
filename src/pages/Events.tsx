import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { resolveLocale, type EventDTO, type MediaAssetDTO } from '@shared/index';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, Ticket, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { PremiumImage } from '@/components/PremiumImage';
import { PremiumMedia } from '@/components/PremiumMedia';
import { usePublicOverlay } from '@/lib/public-ui';
import { DarkShowcaseSection, EditorialSection, SectionIntro } from '@/components/public/PublicPrimitives';
import { LocalizedHead } from '@/components/seo/LocalizedHead';
import { BackendOfflineNotice } from '@/components/states/BackendOfflineNotice';
import { PageState } from '@/components/states/PageState';
import { usePublicBootstrap, usePublicEvents } from '@/hooks/use-site-data';
import { fallbackSiteSettings } from '@/lib/site-settings';
import { isBackendOfflineError } from '@/lib/api-state';
import { cn } from '@/lib/utils';
import { buildBreadcrumbSchema, buildEventsCollectionSchema, buildLocalBusinessSchema, buildWebPageSchema, toLocalizedUrl } from '@/lib/seo';
import { siteMedia } from '@/lib/site-media';
import { LocalizedLink } from '@/components/LocalizedLink';

const formatDate = (value: string, locale: 'hr' | 'en') =>
  new Date(value).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

type EventMediaItem = {
  id: string;
  url: string;
  mediaType: MediaAssetDTO['mediaType'];
  alt?: string;
  focalPointX?: number | null;
  focalPointY?: number | null;
};

const getEventMedia = (event: EventDTO): EventMediaItem[] => {
  const gallery: EventMediaItem[] = event.gallery.map((item) => ({
    id: `gallery-${item.id}`,
    url: item.url,
    mediaType: item.mediaType,
    alt: item.localizations.hr.alt || item.localizations.en.alt,
    focalPointX: item.focalPointX,
    focalPointY: item.focalPointY,
  }));

  if (gallery.length > 0) return gallery;
  if (event.imageUrl) {
    return [{ id: `image-${event.id}`, url: event.imageUrl, mediaType: 'image', alt: event.localizations.hr.title || event.localizations.en.title, focalPointX: null, focalPointY: null }];
  }

  return [{ id: `fallback-${event.id}`, url: siteMedia.hero.src, mediaType: 'image', focalPointX: null, focalPointY: null }];
};

const EventModal = ({ event, locale, onClose }: { event: EventDTO; locale: 'hr' | 'en'; onClose: () => void }) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const media = useMemo(() => getEventMedia(event), [event]);

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [event.id]);

  useEffect(() => {
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
      if (keyboardEvent.key === 'ArrowRight') setActiveMediaIndex((current) => Math.min(current + 1, media.length - 1));
      if (keyboardEvent.key === 'ArrowLeft') setActiveMediaIndex((current) => Math.max(current - 1, 0));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [media.length, onClose]);

  const priceLabel = event.priceLabel ?? (locale === 'hr' ? 'Slobodan ulaz' : 'Free entry');
  const primaryLabel = event.ticketUrl
    ? locale === 'hr'
      ? 'Kupi ulaznicu'
      : 'Buy ticket'
    : event.reservationMode === 'required'
      ? locale === 'hr'
        ? 'Rezerviraj / RSVP'
        : 'Reserve / RSVP'
      : locale === 'hr'
        ? 'Detalji događanja'
        : 'Event details';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-[rgba(6,10,15,0.86)] p-3 backdrop-blur-xl sm:p-5 lg:p-8"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid h-full max-h-[calc(100svh-1.5rem)] w-full max-w-[96rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,15,22,0.98),rgba(8,12,18,0.99))] shadow-[0_60px_160px_-58px_rgba(0,0,0,0.96)] lg:grid-cols-[minmax(0,1.14fr)_minmax(24rem,0.86fr)]"
        onClick={(eventClick) => eventClick.stopPropagation()}
      >
        <div className="relative min-h-0 border-b border-white/8 lg:border-b-0 lg:border-r lg:border-white/8">
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-wrap gap-2">
              {event.featured ? <span className="showcase-chip">{locale === 'hr' ? 'Istaknuto' : 'Featured'}</span> : null}
              <span className="showcase-chip">{event.category}</span>
              {event.soldOut ? (
                <span className="rounded-full bg-[hsl(var(--brand-gold))] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--text-inverse))]">
                  {locale === 'hr' ? 'Rasprodano' : 'Sold out'}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/84 transition hover:bg-black/45"
              aria-label="Close event popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex h-full min-h-0 flex-col">
            <div className="relative min-h-[18rem] flex-1 overflow-hidden bg-[rgba(6,10,15,0.78)]">
              <PremiumMedia
                src={media[activeMediaIndex]?.url ?? siteMedia.hero.src}
                alt={event.localizations[locale].title}
                mediaType={media[activeMediaIndex]?.mediaType ?? 'image'}
                className="absolute inset-0 h-full w-full"
                mediaClassName="h-full w-full"
                priority
                sizes="(min-width: 1024px) 56vw, 100vw"
                controls={media[activeMediaIndex]?.mediaType === 'video'}
                focalPointX={media[activeMediaIndex]?.focalPointX ?? null}
                focalPointY={media[activeMediaIndex]?.focalPointY ?? null}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,16,0.04),rgba(5,11,16,0.12)_22%,rgba(5,11,16,0.44)_64%,rgba(5,11,16,0.86)_100%)]" />

              {media.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveMediaIndex((current) => Math.max(current - 1, 0))}
                    className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/24 text-white/88 transition hover:bg-black/40 lg:inline-flex"
                    aria-label="Previous event image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaIndex((current) => Math.min(current + 1, media.length - 1))}
                    className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/24 text-white/88 transition hover:bg-black/40 lg:inline-flex"
                    aria-label="Next event image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6 lg:p-8">
                <h2 className="max-w-[13ch] font-display text-4xl leading-[0.88] text-[hsl(var(--text-on-image))] sm:text-5xl lg:text-6xl">
                  {event.localizations[locale].title}
                </h2>
                <p className="mt-4 max-w-2xl font-body text-[0.98rem] leading-8 text-white/92">{event.localizations[locale].teaser}</p>
              </div>
            </div>

            {media.length > 1 ? (
              <div className="hide-scrollbar flex gap-3 overflow-x-auto border-t border-white/8 bg-black/18 px-4 py-4 sm:px-5 lg:px-6">
                {media.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveMediaIndex(index)}
                    className={cn(
                      'relative h-20 w-16 shrink-0 overflow-hidden rounded-[1rem] border transition sm:h-24 sm:w-20',
                      activeMediaIndex === index ? 'border-[hsl(var(--brand-gold))] shadow-[0_0_0_1px_hsl(var(--brand-gold))]' : 'border-white/12 opacity-84 hover:opacity-100'
                    )}
                  >
                    <PremiumMedia src={item.url} alt={item.alt || `${event.localizations[locale].title} – ${locale === 'hr' ? 'pregled medija' : 'media preview'}`} mediaType={item.mediaType} className="h-full w-full" mediaClassName="h-full w-full" backdrop={false} controls={false} focalPointX={item.focalPointX} focalPointY={item.focalPointY} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="hide-scrollbar overflow-y-auto p-5 sm:p-6 lg:p-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 text-[hsl(var(--brand-gold))]">
                <CalendarDays className="h-4 w-4" />
                <p className="font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Datum i vrijeme' : 'Date & time'}</p>
              </div>
              <p className="mt-3 font-body text-sm leading-7 text-white/82">{formatDate(event.startsAt, locale)}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 text-[hsl(var(--brand-gold))]">
                <Ticket className="h-4 w-4" />
                <p className="font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Ulaz' : 'Entry'}</p>
              </div>
              <p className="mt-3 font-body text-sm leading-7 text-white/82">{priceLabel}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 text-[hsl(var(--brand-gold))]">
                <Users className="h-4 w-4" />
                <p className="font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Kapacitet' : 'Capacity'}</p>
              </div>
              <p className="mt-3 font-body text-sm leading-7 text-white/82">{event.capacity} {locale === 'hr' ? 'mjesta' : 'spots'}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 text-[hsl(var(--brand-gold))]">
                <Clock3 className="h-4 w-4" />
                <p className="font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Način prijave' : 'Access mode'}</p>
              </div>
              <p className="mt-3 font-body text-sm leading-7 text-white/82">
                {event.ticketUrl ? (locale === 'hr' ? 'Vanjske ulaznice' : 'External ticketing') : event.reservationMode}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5 lg:p-6">
            <p className="section-kicker">{locale === 'hr' ? 'O događanju' : 'About the event'}</p>
            <p className="mt-4 font-body text-[0.98rem] leading-8 text-white/90">{event.localizations[locale].description}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {event.ticketUrl ? (
              <a href={event.ticketUrl} target="_blank" rel="noreferrer" className="luxury-button-primary">
                {primaryLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <LocalizedLink to={`/events/${event.slug}`} className="luxury-button-primary">
                {primaryLabel}
              </LocalizedLink>
            )}
            <button type="button" onClick={onClose} className="luxury-button-secondary">
              {locale === 'hr' ? 'Zatvori' : 'Close'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Events = () => {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const { data: bootstrap } = usePublicBootstrap(locale);
  const { data: events, isLoading, isError, error } = usePublicEvents();
  const [view, setView] = useState<'featured' | 'calendar' | 'list'>('featured');
  const [category, setCategory] = useState<string>('all');
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
  const deferredCategory = useDeferredValue(category);
  usePublicOverlay('event-modal', Boolean(selectedEvent));

  const monthDate = useMemo(() => {
    const base = new Date();
    return new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((event) => deferredCategory === 'all' || event.category === deferredCategory);
  }, [deferredCategory, events]);

  const monthEvents = useMemo(
    () =>
      filteredEvents.filter((event) => {
        const date = new Date(event.startsAt);
        return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
      }),
    [filteredEvents, monthDate]
  );

  const calendarDays = useMemo(() => {
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const startOffset = (start.getDay() + 6) % 7;
    const total = Math.ceil((startOffset + end.getDate()) / 7) * 7;

    return Array.from({ length: total }, (_, index) => {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), index - startOffset + 1);
      const iso = date.toISOString().slice(0, 10);
      return {
        iso,
        inMonth: date.getMonth() === monthDate.getMonth(),
        day: date.getDate(),
        events: monthEvents.filter((event) => event.startsAt.slice(0, 10) === iso),
      };
    });
  }, [monthDate, monthEvents]);

  const backendOffline = isBackendOfflineError(error);

  if (isLoading) return <Layout><PageState title={t('common.loading')} description={t('events_page.subtitle')} /></Layout>;
  if (isError && !backendOffline) return <Layout><PageState title={t('common.error')} description={t('events_page.subtitle')} /></Layout>;

  const pageTitle = locale === 'hr' ? 'Događanja uz more u Tribunju | Nautica' : 'Seafront events in Tribunj | Nautica';
  const pageDescription = locale === 'hr'
    ? 'Događanja uz more u Tribunju, s programom koji privlači i goste iz Vodica i Srime na sunset večeri, glazbu i rezervirane stolove.'
    : 'Seafront events in Tribunj that also attract guests from Vodice and Srima for sunset evenings, music, and reserved tables.';
  const pageUrl = toLocalizedUrl('/events', locale);
  const eventList = events ?? [];
  const categories = ['all', ...new Set(eventList.map((event) => event.category))];

  return (
    <Layout>
      <LocalizedHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/events"
        locale={locale}
        image={siteMedia.events.src}
        imageAlt={locale === 'hr' ? 'Događanja i večeri u Nautici u Tribunju' : 'Events and evenings at Nautica in Tribunj'}
        preloadImage={siteMedia.events.webpSrc}
        preloadImageType="image/webp"
        schemas={[
          buildWebPageSchema({ locale, title: pageTitle, description: pageDescription, url: pageUrl }),
          buildEventsCollectionSchema(filteredEvents.slice(0, 12), locale, pageUrl),
          buildLocalBusinessSchema(locale, bootstrap?.settings ?? fallbackSiteSettings),
          buildBreadcrumbSchema([
            { name: 'Nautica', url: toLocalizedUrl('/', locale) },
            { name: t('events_page.title'), url: pageUrl },
          ]),
        ]}
      />

      <DarkShowcaseSection className="page-top-safe">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionIntro eyebrow={t('events_page.overview_eyebrow')} title={t('events_page.title')} description={t('events_page.overview_description')} tone="dark" />
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {(['featured', 'calendar', 'list'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded-full px-4 py-2.5 font-body text-[10px] uppercase tracking-[0.22em] ${view === mode ? 'bg-[hsl(var(--brand-gold))] text-[hsl(var(--text-inverse))]' : 'border border-white/10 bg-white/[0.04] text-[hsl(var(--text-secondary))]'}`}
              >
                {t(`events_page.views.${mode}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="hide-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
          {categories.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setCategory(entry)}
              className={`rounded-full px-4 py-2.5 font-body text-[10px] uppercase tracking-[0.22em] ${category === entry ? 'bg-white text-[hsl(var(--text-inverse))]' : 'border border-white/10 bg-white/[0.03] text-[hsl(var(--text-secondary))]'}`}
            >
              {entry}
            </button>
          ))}
        </div>
      </DarkShowcaseSection>

      {backendOffline ? (
        <EditorialSection tone="ivory">
          <BackendOfflineNotice
            title={locale === 'hr' ? 'Raspored događanja je trenutno offline.' : 'The event schedule is currently offline.'}
            body={locale === 'hr'
              ? 'Stranica i navigacija rade, ali live događanja, kalendar i detalji traže backend podatke. Pokušajte ponovno uskoro.'
              : 'The page and navigation still work, but live events, the calendar, and event details require backend data. Please try again shortly.'}
          />
        </EditorialSection>
      ) : view === 'featured' ? (
        <DarkShowcaseSection className="pt-0">
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredEvents.map((event) => (
              <button key={event.id} type="button" onClick={() => setSelectedEvent(event)} className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 text-left">
                <div className="aspect-[16/11]">
                  <PremiumMedia
                    src={getEventMedia(event)[0].url}
                    alt={event.localizations[locale].title}
                    mediaType={getEventMedia(event)[0].mediaType}
                    className="h-full w-full"
                    mediaClassName={getEventMedia(event)[0].mediaType === 'image' ? 'transition duration-700 group-hover:scale-[1.04]' : 'h-full w-full'}
                    sizes="(min-width: 1024px) 48vw, 100vw"
                    controls={getEventMedia(event)[0].mediaType === 'video'}
                  />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,17,0.08),rgba(6,11,17,0.88))]" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex flex-wrap gap-2">
                    {event.featured ? <span className="showcase-chip">{t('events_page.featured_badge')}</span> : null}
                    {event.ticketUrl ? <span className="showcase-chip">{locale === 'hr' ? 'Ulaznice' : 'Tickets'}</span> : null}
                    {event.soldOut ? <span className="showcase-chip border-transparent bg-[hsl(var(--accent-warm))] text-[hsl(var(--text-inverse))]">{t('events_page.sold_out')}</span> : null}
                  </div>
                  <h2 className="mt-4 font-display text-4xl text-[hsl(var(--text-on-image))]">{event.localizations[locale].title}</h2>
                  <p className="mt-4 body-md text-white/90">{event.localizations[locale].teaser}</p>
                  <div className="mt-6 flex items-center gap-5 text-white/86">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
                      <span className="font-body text-[10px] uppercase tracking-[0.22em]">
                        {new Date(event.startsAt).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
                      <span className="font-body text-sm">{event.priceLabel ?? t('events_page.free_entry')}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DarkShowcaseSection>
      ) : null}

      {!backendOffline && view === 'list' ? (
        <EditorialSection tone="ivory">
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <button key={event.id} type="button" onClick={() => setSelectedEvent(event)} className="grid gap-5 overflow-hidden rounded-[1.8rem] border border-black/10 bg-white/40 p-4 text-left md:grid-cols-[15rem_minmax(0,1fr)] md:p-5">
                <div className="overflow-hidden rounded-[1.35rem]">
                  <PremiumMedia
                    src={getEventMedia(event)[0].url}
                    alt={event.localizations[locale].title}
                    mediaType={getEventMedia(event)[0].mediaType}
                    className="aspect-[4/5] h-full w-full"
                    mediaClassName="h-full w-full"
                    controls={getEventMedia(event)[0].mediaType === 'video'}
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="section-kicker">
                      {new Date(event.startsAt).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <h2 className="mt-3 font-display text-4xl text-[hsl(var(--text-inverse))]">{event.localizations[locale].title}</h2>
                    <p className="mt-4 body-md text-[hsl(var(--text-inverse))]/88">{event.localizations[locale].description}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--text-inverse))]">{event.category}</span>
                    {event.priceLabel ? <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--text-inverse))]">{event.priceLabel}</span> : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </EditorialSection>
      ) : null}

      {!backendOffline && view === 'calendar' ? (
        <EditorialSection tone="ivory">
          <div className="overflow-hidden rounded-[2rem] border border-black/8 shadow-[var(--shadow-premium)]">
            <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-5 sm:px-8">
              <button type="button" onClick={() => setMonthOffset((current) => current - 1)} className="luxury-button-secondary border-black/10 bg-black/5 text-[hsl(var(--text-inverse))]">
                {t('events_page.previous')}
              </button>
              <h2 className="font-display text-3xl text-[hsl(var(--text-inverse))]">
                {monthDate.toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-GB', { month: 'long', year: 'numeric' })}
              </h2>
              <button type="button" onClick={() => setMonthOffset((current) => current + 1)} className="luxury-button-secondary border-black/10 bg-black/5 text-[hsl(var(--text-inverse))]">
                {t('events_page.next')}
              </button>
            </div>

            <div className="hidden gap-3 p-5 md:grid md:grid-cols-7">
              {calendarDays.map((day) => (
                <div key={day.iso} className={cn('min-h-40 rounded-[1.25rem] border p-3', day.inMonth ? 'border-black/10 bg-black/[0.03]' : 'border-black/5 bg-black/[0.02] opacity-50')}>
                  <p className="font-body text-xs text-[hsl(var(--text-inverse))]/90">{day.day}</p>
                  <div className="mt-3 space-y-2">
                    {day.events.slice(0, 2).map((event) => (
                      <button key={event.id} type="button" onClick={() => setSelectedEvent(event)} className="block w-full overflow-hidden rounded-[1rem] border border-black/8 bg-white/76 text-left shadow-[0_10px_26px_-20px_rgba(0,0,0,0.2)]">
                        <div className="h-20 overflow-hidden">
                          <PremiumMedia
                            src={getEventMedia(event)[0].url}
                            alt={event.localizations[locale].title}
                            mediaType={getEventMedia(event)[0].mediaType}
                            className="h-full w-full"
                            mediaClassName="h-full w-full"
                            controls={false}
                          />
                        </div>
                        <div className="p-2.5">
                          <p className="font-display text-[1.08rem] leading-tight text-[hsl(var(--text-inverse))] line-clamp-2">{event.localizations[locale].title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 p-5 md:hidden">
              {calendarDays.filter((day) => day.events.length > 0).map((day) => (
                <div key={day.iso} className="rounded-[1.25rem] border border-black/10 bg-black/[0.03] p-4">
                  <p className="section-kicker">
                    {new Date(day.iso).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </p>
                  <div className="mt-3 grid gap-3">
                    {day.events.map((event) => (
                      <button key={event.id} type="button" onClick={() => setSelectedEvent(event)} className="overflow-hidden rounded-[1rem] border border-black/10 bg-white/50 text-left shadow-[0_14px_30px_-24px_rgba(0,0,0,0.3)]">
                        <div className="h-40 overflow-hidden">
                          <PremiumMedia
                            src={getEventMedia(event)[0].url}
                            alt={event.localizations[locale].title}
                            mediaType={getEventMedia(event)[0].mediaType}
                            className="h-full w-full"
                            mediaClassName="h-full w-full"
                            controls={false}
                          />
                        </div>
                        <div className="p-4">
                          <p className="font-display text-2xl text-[hsl(var(--text-inverse))]">{event.localizations[locale].title}</p>
                          <p className="mt-1 text-sm text-[hsl(var(--text-inverse))]/82">{event.localizations[locale].teaser}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </EditorialSection>
      ) : null}

      <AnimatePresence>
        {selectedEvent ? <EventModal event={selectedEvent} locale={locale} onClose={() => setSelectedEvent(null)} /> : null}
      </AnimatePresence>
    </Layout>
  );
};

export default Events;
