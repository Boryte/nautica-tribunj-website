import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { resolveLocale } from '@shared/index';
import { CalendarDays, ExternalLink, Ticket, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { PremiumImage } from '@/components/PremiumImage';
import { PremiumMedia } from '@/components/PremiumMedia';
import {
  BookingField,
  BookingInput,
  BookingSurface,
  DarkShowcaseSection,
  HeroFrame,
} from '@/components/public/PublicPrimitives';
import { LocalizedHead } from '@/components/seo/LocalizedHead';
import { BackendOfflineNotice } from '@/components/states/BackendOfflineNotice';
import { PageState } from '@/components/states/PageState';
import { usePublicBootstrap, usePublicEvent } from '@/hooks/use-site-data';
import { fallbackSiteSettings } from '@/lib/site-settings';
import { isBackendOfflineError } from '@/lib/api-state';
import {
  buildEventReservationWhatsAppUrl,
  flushPendingSubmissions,
  openWhatsAppConversation,
  queuePendingSubmission,
  resolveWhatsAppPhone,
} from '@/lib/whatsapp';
import { siteMedia } from '@/lib/site-media';
import { buildBreadcrumbSchema, buildEventSchema, buildLocalBusinessSchema, buildWebPageSchema, toLocalizedUrl } from '@/lib/seo';

const EventDetail = () => {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const { data: event, isLoading, isError, error } = usePublicEvent(slug);
  const { data: bootstrap } = usePublicBootstrap(locale);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const backendOffline = isBackendOfflineError(error);

  if (isLoading) return <Layout><PageState title={t('common.loading')} description={t('events_page.subtitle')} /></Layout>;
  if ((isError || !event) && !backendOffline) return <Layout><PageState title={t('common.error')} description={t('events_page.subtitle')} /></Layout>;
  if (backendOffline) {
    return (
      <Layout>
        <DarkShowcaseSection className="page-top-safe">
          <BackendOfflineNotice
            title={locale === 'hr' ? 'Detalj događanja trenutno nije dostupan.' : 'This event detail is currently unavailable.'}
            body={locale === 'hr'
              ? 'Frontend radi, ali pojedinačni event detalj i prijava na događanje traže backend podatke. Vratite se na listu događanja ili pokušajte ponovno uskoro.'
              : 'The frontend is online, but the individual event detail and registration flow require backend data. Return to the events page or try again shortly.'}
          />
        </DarkShowcaseSection>
      </Layout>
    );
  }

  const settings = bootstrap?.settings ?? fallbackSiteSettings;
  const pageTitle = `${event.localizations[locale].title} | Nautica Tribunj`;
  const pageDescription = event.localizations[locale].teaser;
  const pageUrl = toLocalizedUrl(`/events/${event.slug}`, locale);

  const handleReservationSubmit = async () => {
    const whatsappPhone = resolveWhatsAppPhone(settings);
    if (!whatsappPhone) {
      setSubmissionError(locale === 'hr' ? 'WhatsApp broj nije postavljen u postavkama.' : 'WhatsApp number is not configured in settings.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload = { ...form, locale } as const;
      const whatsappUrl = buildEventReservationWhatsAppUrl({
        settings,
        locale,
        event,
        values: payload,
      });

      openWhatsAppConversation(whatsappUrl);
      queuePendingSubmission({
        id: `${event.id}:${payload.email}:${Date.now()}`,
        kind: 'event_registration',
        endpoint: `/api/events/${event.id}/register`,
        payload,
      });
      setSubmissionSuccess(
        locale === 'hr'
          ? 'WhatsApp poruka za rezervaciju događaja je otvorena. Backend evidencija će se sinkronizirati čim API bude dostupan.'
          : 'The WhatsApp event reservation message has been opened. The backend record will sync as soon as the API is available.'
      );
      void flushPendingSubmissions();
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <LocalizedHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath={`/events/${event.slug}`}
        locale={locale}
        image={event.gallery[0]?.url ?? event.imageUrl ?? siteMedia.events.src}
        imageAlt={event.localizations[locale].title}
        preloadImage={siteMedia.events.webpSrc}
        preloadImageType="image/webp"
        type="article"
        schemas={[
          buildWebPageSchema({ locale, title: pageTitle, description: pageDescription, url: pageUrl }),
          buildEventSchema(event, locale, settings),
          buildLocalBusinessSchema(locale, settings),
          buildBreadcrumbSchema([
            { name: 'Nautica', url: toLocalizedUrl('/', locale) },
            { name: t('events_page.title'), url: toLocalizedUrl('/events', locale) },
            { name: event.localizations[locale].title, url: pageUrl },
          ]),
        ]}
      />

      <HeroFrame
        compact
        eyebrow={event.category}
        title={event.localizations[locale].title}
        description={event.localizations[locale].teaser}
        media={
          <PremiumMedia
            src={event.gallery[0]?.url ?? event.imageUrl ?? siteMedia.hero.src}
            alt={event.localizations[locale].title}
            mediaType={event.gallery[0]?.mediaType ?? 'image'}
            className="hero-media"
            mediaClassName="h-full w-full"
            priority
            sizes="100vw"
            controls={event.gallery[0]?.mediaType === 'video'}
            focalPointX={event.gallery[0]?.focalPointX ?? null}
            focalPointY={event.gallery[0]?.focalPointY ?? null}
          />
        }
        aside={
          <div className="w-full max-w-md border border-white/10 bg-black/22 p-5 backdrop-blur-md">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
                <p className="font-body text-sm text-white/90">
                  {new Date(event.startsAt).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Ticket className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
                <p className="font-body text-sm text-white/90">{event.priceLabel ?? t('events_page.free_entry')}</p>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
                <p className="font-body text-sm text-white/90">
                  {event.soldOut ? t('events_page.sold_out') : `${event.capacity ?? t('event_detail.limited_spots')} ${t('event_detail.spots_suffix')}`}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <DarkShowcaseSection className="pt-12 sm:pt-16 lg:pt-20">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <p className="section-kicker">{t('event_detail.narrative_label')}</p>
            <p className="mt-5 body-xl text-white/90">{event.localizations[locale].description}</p>

            {event.ticketUrl ? (
              <a href={event.ticketUrl} target="_blank" rel="noreferrer" className="luxury-button-primary mt-6">
                {locale === 'hr' ? 'Kupi ulaznicu' : 'Buy ticket'}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}

            {event.gallery.length > 1 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {event.gallery.slice(1, 4).map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-[1.5rem] border border-white/10">
                    <PremiumMedia
                      src={item.url}
                      alt={item.localizations[locale].alt || `${event.localizations[locale].title} – ${locale === 'hr' ? 'fotografija događanja' : 'event photo'}`}
                      mediaType={item.mediaType}
                      className="h-48 w-full"
                      mediaClassName="h-full w-full"
                      sizes="(min-width: 640px) 24vw, 100vw"
                      controls={item.mediaType === 'video'}
                      focalPointX={item.focalPointX}
                      focalPointY={item.focalPointY}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <BookingSurface className="p-6 sm:p-8">
            <p className="section-kicker">{event.ticketUrl ? (locale === 'hr' ? 'Ulaznice' : 'Tickets') : event.reservationMode === 'required' ? t('event_detail.reservation_cta') : t('events_page.rsvp')}</p>
            <h2 className="mt-3 display-md">
              {event.ticketUrl
                ? locale === 'hr'
                  ? 'Naplaćeni ulaz vodi na vanjski ticketing link.'
                  : 'Paid entry uses an external ticketing link.'
                : event.reservationMode === 'required'
                  ? t('event_detail.reservation_title')
                  : t('event_detail.reservation_interest_title')}
            </h2>

            {event.ticketUrl ? (
              <div className="mt-6 rounded-[1.4rem] border border-black/10 bg-white/60 p-5">
                <p className="font-body text-sm leading-7 text-[hsl(var(--text-inverse))]/88">
                  {locale === 'hr'
                    ? 'Za ovaj event koristimo vanjski sustav naplate. Gumb ispod vodi direktno na kupnju ulaznice.'
                    : 'This event uses an external checkout flow. Use the button below to go directly to ticket purchase.'}
                </p>
                <a href={event.ticketUrl} target="_blank" rel="noreferrer" className="luxury-button-primary mt-5">
                  {locale === 'hr' ? 'Kupi ulaznicu' : 'Buy ticket'}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={(submitEvent) => {
                submitEvent.preventDefault();
                void handleReservationSubmit();
              }}
            >
              <BookingField label={t('reservation_page.form.name')}>
                <BookingInput value={form.name} onChange={(eventChange) => setForm((current) => ({ ...current, name: eventChange.target.value }))} />
              </BookingField>
              <BookingField label={t('reservation_page.form.email')}>
                <BookingInput type="email" value={form.email} onChange={(eventChange) => setForm((current) => ({ ...current, email: eventChange.target.value }))} />
              </BookingField>
              <BookingField label={t('reservation_page.form.phone')}>
                <BookingInput value={form.phone} onChange={(eventChange) => setForm((current) => ({ ...current, phone: eventChange.target.value }))} />
              </BookingField>
              {submissionSuccess ? <p className="text-sm text-emerald-700">{submissionSuccess}</p> : null}
              {submissionError ? <p className="text-sm text-rose-700">{submissionError}</p> : null}
              <button type="submit" className="luxury-button-primary mt-2 w-full justify-center" disabled={isSubmitting}>
                {isSubmitting
                  ? (locale === 'hr' ? 'Otvaramo WhatsApp...' : 'Opening WhatsApp...')
                  : event.reservationMode === 'required'
                    ? (locale === 'hr' ? 'Rezerviraj preko WhatsAppa' : 'Reserve via WhatsApp')
                    : (locale === 'hr' ? 'Pošalji RSVP na WhatsApp' : 'Send RSVP to WhatsApp')}
              </button>
            </form>
            )}
          </BookingSurface>
        </div>
      </DarkShowcaseSection>
    </Layout>
  );
};

export default EventDetail;
