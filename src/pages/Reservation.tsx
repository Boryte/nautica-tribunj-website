import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationIntentTypes, reservationSubmissionSchema, resolveLocale, type ReservationIntentType } from '@shared/index';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Waves,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Reveal } from '@/components/Reveal';
import {
  BookingField,
  BookingInput,
  BookingSurface,
  BookingTextarea,
  EditorialSection,
  LuxuryButtonPrimary,
  LuxuryButtonSecondary,
} from '@/components/public/PublicPrimitives';
import { LocalizedHead } from '@/components/seo/LocalizedHead';
import { BackendOfflineNotice } from '@/components/states/BackendOfflineNotice';
import { PageState } from '@/components/states/PageState';
import { usePublicBootstrap } from '@/hooks/use-site-data';
import { fallbackSiteSettings } from '@/lib/site-settings';
import { buildBreadcrumbSchema, buildLocalBusinessSchema, buildWebPageSchema, GOOGLE_MAPS_URL, toLocalizedUrl } from '@/lib/seo';
import { siteMedia } from '@/lib/site-media';
import { LocalizedLink } from '@/components/LocalizedLink';
import { cn } from '@/lib/utils';
import {
  buildReservationWhatsAppUrl,
  flushPendingSubmissions,
  openWhatsAppConversation,
  queuePendingSubmission,
  resolveWhatsAppPhone,
} from '@/lib/whatsapp';
type ReservationFormValues = {
  name: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  area: 'terrace' | 'indoor' | 'bar' | 'vip';
  notes: string;
  consent: boolean;
};

const timeBlocks = {
  lunch: ['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15'],
  dinner: ['19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15'],
};

const areaImageMap: Record<ReservationFormValues['area'], string> = {
  terrace: 'Sunset-facing terrace',
  indoor: 'Interior lounge',
  bar: 'Aperitivo counter',
  vip: 'Premium waterfront section',
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Reservation = () => {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const [searchParams] = useSearchParams();
  const { data: bootstrap, isLoading, isError, backendOffline } = usePublicBootstrap(locale);
  const [step, setStep] = useState<1 | 2>(1);
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<null | {
    whatsappUrl: string;
    dateLabel: string;
    time: string;
    areaLabel: string;
    guests: number;
  }>(null);

  const occasionOptions = locale === 'hr'
    ? ['Rođendan', 'Godišnjica', 'Spoj', 'Poslovni susret', 'Proslava']
    : ['Birthday', 'Anniversary', 'Date night', 'Business dinner', 'Celebration'];

  const dietaryOptions = locale === 'hr'
    ? ['Vegan', 'Vegetarijansko', 'Bez glutena', 'Bez laktoze', 'Alergija na orašaste plodove']
    : ['Vegan', 'Vegetarian', 'Gluten free', 'Lactose free', 'Nut allergy'];

  const upcomingDates = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        value: toIsoDate(date),
        weekday: new Intl.DateTimeFormat(locale === 'hr' ? 'hr-HR' : 'en-GB', { weekday: 'short' }).format(date),
        day: new Intl.DateTimeFormat(locale === 'hr' ? 'hr-HR' : 'en-GB', { day: '2-digit' }).format(date),
        month: new Intl.DateTimeFormat(locale === 'hr' ? 'hr-HR' : 'en-GB', { month: 'short' }).format(date),
      };
    });
  }, [locale]);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(
      reservationSubmissionSchema.pick({
        name: true,
        email: true,
        phone: true,
        guests: true,
        date: true,
        time: true,
        area: true,
        notes: true,
        consent: true,
      })
    ),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      guests: 2,
      date: '',
      time: '',
      area: 'terrace',
      notes: '',
      consent: false,
    },
  });

  useEffect(() => {
    if (!form.getValues('date') && upcomingDates[0]) {
      form.setValue('date', upcomingDates[0].value, { shouldDirty: false });
    }
  }, [form, upcomingDates]);

  const settings = bootstrap?.settings ?? fallbackSiteSettings;

  if (isLoading) {
    return <Layout><PageState title={t('common.loading')} description={t('reservation_page.subtitle')} /></Layout>;
  }

  const pageTitle = locale === 'hr' ? 'Rezervacija stola u Tribunju | Nautica' : 'Reserve a table in Tribunj | Nautica';
  const pageDescription = locale === 'hr'
    ? 'Rezervirajte stol u Nautici u Tribunju za kavu, sunset koktele i večeri uz more, uključujući dolaske iz Vodica i Srime.'
    : 'Reserve a table at Nautica in Tribunj for coffee, sunset cocktails, and evenings by the sea, including arrivals from Vodice and Srima.';
  const pageUrl = toLocalizedUrl('/reservation', locale);
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedArea = form.watch('area');
  const guests = form.watch('guests');
  const requestedIntent = searchParams.get('intent');
  const normalizedRequestedIntent = reservationIntentTypes.find((intent) => intent === requestedIntent);
  const intentType: ReservationIntentType = normalizedRequestedIntent ?? (selectedArea === 'vip' ? 'vip' : 'standard');

  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat(locale === 'hr' ? 'hr-HR' : 'en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }).format(new Date(selectedDate))
    : locale === 'hr' ? 'Odaberite datum' : 'Choose a date';

  const trustPoints = [
    { icon: ShieldCheck, title: t('reservation_page.trust_points.confirmation.title'), body: t('reservation_page.trust_points.confirmation.body') },
    { icon: Clock3, title: t('reservation_page.trust_points.availability.title'), body: t('reservation_page.trust_points.availability.body') },
    { icon: Waves, title: t('reservation_page.trust_points.areas.title'), body: t('reservation_page.trust_points.areas.body') },
  ];

  const continueToDetails = async () => {
    const valid = await form.trigger(['guests', 'date', 'time', 'area']);
    if (valid) setStep(2);
  };

  const toggleTag = (value: string, current: string[], setter: (next: string[]) => void) => {
    setter(current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]);
  };

  const submitReservation = async (values: ReservationFormValues) => {
    const whatsappPhone = resolveWhatsAppPhone(settings);
    if (!whatsappPhone) {
      setSubmissionError(locale === 'hr' ? 'WhatsApp broj nije postavljen u postavkama.' : 'WhatsApp number is not configured in settings.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const compiledNotes = [
        values.notes?.trim(),
        occasionTags.length ? `${locale === 'hr' ? 'Prigoda' : 'Occasion'}: ${occasionTags.join(', ')}` : '',
        dietaryTags.length ? `${locale === 'hr' ? 'Prehrambene napomene' : 'Dietary notes'}: ${dietaryTags.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const payload = {
        ...values,
        notes: compiledNotes,
        locale,
        idempotencyKey: crypto.randomUUID(),
        honeypot: '',
        submittedAt: new Date().toISOString(),
        intentType,
        eventId: null,
      } as const;

      const whatsappUrl = buildReservationWhatsAppUrl({
        settings,
        locale,
        values: payload,
        notes: compiledNotes,
        intentType,
      });

      openWhatsAppConversation(whatsappUrl);
      queuePendingSubmission({
        id: payload.idempotencyKey,
        kind: 'reservation',
        endpoint: '/api/reservations',
        payload,
      });
      setSubmissionState({
        whatsappUrl,
        dateLabel: selectedDateLabel,
        time: values.time,
        areaLabel: t(`reservation_page.form.areas.${values.area}`),
        guests: values.guests,
      });
      void flushPendingSubmissions();
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : t('reservation_page.form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <LocalizedHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/reservation"
        locale={locale}
        image={siteMedia.coffee.src}
        imageAlt={locale === 'hr' ? 'Rezervacija stola u Nautici u Tribunju' : 'Reserve a table at Nautica in Tribunj'}
        schemas={[
          buildWebPageSchema({ locale, title: pageTitle, description: pageDescription, url: pageUrl }),
          buildLocalBusinessSchema(locale, settings),
          buildBreadcrumbSchema([
            { name: 'Nautica', url: toLocalizedUrl('/', locale) },
            { name: t('reservation_page.title'), url: pageUrl },
          ]),
        ]}
      />


      <section className="page-top-safe page-gutter relative z-20 bg-[linear-gradient(180deg,rgba(12,18,26,0.94),rgba(242,233,220,0)_12rem)] pb-20 sm:pb-24 lg:pb-28">
        <div className="page-width space-y-6">
          {backendOffline ? (
            <BackendOfflineNotice
              compact
              title={locale === 'hr' ? 'Backend je offline, ali rezervacija i dalje radi.' : 'The backend is offline, but reservations still work.'}
              body={locale === 'hr'
                ? 'Možete normalno poslati rezervaciju preko WhatsAppa. Serverska evidencija i sinkronizacija prijave nastavit će se automatski čim API ponovno bude dostupan.'
                : 'You can still send the reservation through WhatsApp. Server-side logging and sync will resume automatically as soon as the API is available again.'}
            />
          ) : null}
          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="panel-night-elevated rounded-[1.9rem] p-6 text-white sm:p-7">
              <p className="section-kicker">{locale === 'hr' ? 'Flow rezervacije' : 'Reservation flow'}</p>
              <h2 className="mt-4 font-display text-4xl leading-[0.94] text-on-dark-title headline-focus wave-emphasis sm:text-5xl">
                {locale === 'hr' ? 'Brz i jednostavan proces rezervacije' : 'Fast and simple reservation process'}
              </h2>
              <p className="mt-4 max-w-2xl font-body text-[0.98rem] leading-8 text-on-dark-body">
                {locale === 'hr' ? 'Termin, zona i broj gostiju sada ulaze u jasniji premium raspored prije nego tražimo osobne podatke.' : 'Time, area, and guest count now enter a cleaner premium layout before personal details are requested.'}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="panel-ivory-elevated rounded-[1.6rem] p-5">
                    <Icon className="gold-glow h-5 w-5 text-[hsl(var(--brand-gold))]" />
                    <p className="mt-4 font-display text-[1.9rem] leading-[0.96] text-on-light-title headline-focus">{point.title}</p>
                    <p className="mt-2 font-body text-sm leading-7 text-on-light-body">{point.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
          {submissionState ? (
            <BookingSurface className="mx-auto max-w-5xl p-8 sm:p-10 lg:p-12">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[hsl(var(--brand-gold))]/35 bg-[hsl(var(--brand-gold))]/14">
                    <CheckCircle2 className="h-9 w-9 text-[hsl(var(--brand-gold))]" />
                  </div>
                  <p className="mt-8 font-display text-5xl">
                    {locale === 'hr' ? 'Rezervacija je preusmjerena na WhatsApp.' : 'The reservation was routed to WhatsApp.'}
                  </p>
                  <p className="text-on-light-body mt-5 max-w-2xl body-xl">
                    {locale === 'hr'
                      ? 'Otvorili smo WhatsApp poruku s kompletnim detaljima rezervacije. Istu prijavu smo paralelno stavili u red za backend evidenciju čim API bude dostupan.'
                      : 'We opened a WhatsApp message with the full reservation details. The same request has also been queued for backend history as soon as the API is available.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={submissionState.whatsappUrl} target="_blank" rel="noreferrer" className="luxury-button-primary">
                      {locale === 'hr' ? 'Otvori WhatsApp ponovno' : 'Open WhatsApp again'}
                    </a>
                    <LocalizedLink to="/" className="luxury-button-secondary border-black/10 bg-black/5 text-on-light-title">
                      {locale === 'hr' ? 'Natrag na početnu' : 'Back to home'}
                    </LocalizedLink>
                  </div>
                </div>
                <div className="booking-panel p-6">
                  <p className="section-kicker">{locale === 'hr' ? 'Sažetak rezervacije' : 'Reservation summary'}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.2rem] bg-white/60 px-4 py-3">
                      <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Datum' : 'Date'}</p>
                      <p className="text-on-light-title mt-2 font-display text-2xl">{submissionState.dateLabel}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white/60 px-4 py-3">
                      <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Vrijeme' : 'Time'}</p>
                      <p className="text-on-light-title mt-2 font-display text-2xl">{submissionState.time}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.2rem] bg-white/60 px-4 py-3">
                      <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Prostor' : 'Area'}</p>
                      <p className="text-on-light-title mt-2 font-display text-2xl">{submissionState.areaLabel}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white/60 px-4 py-3">
                      <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Gosti' : 'Guests'}</p>
                      <p className="text-on-light-title mt-2 font-display text-2xl">{submissionState.guests}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <LuxuryButtonSecondary className="border-black/10 bg-black/5 text-on-light-title">{settings.whatsappPhone}</LuxuryButtonSecondary>
                    <LuxuryButtonSecondary className="border-black/10 bg-black/5 text-on-light-title">{settings.email}</LuxuryButtonSecondary>
                  </div>
                </div>
              </div>
            </BookingSurface>
          ) : (
            <BookingSurface className="mx-auto max-w-6xl">
              <div className="grid gap-0 lg:grid-cols-[1.18fr_0.82fr]">
                <div className="p-5 sm:p-7 lg:p-10">
                  <div className="flex flex-col gap-5 border-b border-black/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="section-kicker">{t('reservation_page.table_label')}</p>
                      <h2 className="text-on-light-title mt-3 font-display text-[2.8rem] leading-[0.92] sm:text-[3.6rem]">
                      <span className="headline-focus wave-emphasis text-on-light-title">{t('reservation_page.table_title')}</span>
                      </h2>
                    </div>
                    <div className="grid min-w-[18rem] grid-cols-2 gap-2 rounded-[1.4rem] border border-black/10 bg-white/55 p-2">
                      {[
                        { id: 1, label: locale === 'hr' ? 'Rezervacija' : 'Booking' },
                        { id: 2, label: locale === 'hr' ? 'Vaši podaci' : 'Your details' },
                      ].map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          disabled={entry.id === 2 && step === 1}
                          onClick={() => entry.id === 1 ? setStep(1) : setStep(2)}
                          className={cn(
                            'rounded-[1rem] px-4 py-3 text-left transition',
                            step === entry.id
                              ? 'bg-[hsl(var(--text-inverse))] text-white shadow-[var(--shadow-soft)]'
                              : 'text-on-light-body'
                          )}
                        >
                          <span className="font-body text-[10px] uppercase tracking-[0.24em]">{`0${entry.id}`}</span>
                          <p className="mt-2 font-body text-sm">{entry.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <motion.form
                    onSubmit={form.handleSubmit(submitReservation)}
                    className="mt-7"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {step === 1 ? (
                      <div className="grid gap-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="booking-panel p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.24em]">{t('reservation_page.form.guests')}</p>
                                <p className="mt-2 font-display text-4xl">{guests}</p>
                              </div>
                              <UsersRound className="h-5 w-5 text-[hsl(var(--brand-gold))]" />
                            </div>
                            <div className="mt-5 grid grid-cols-[3.25rem_1fr_3.25rem] overflow-hidden rounded-[1rem] border border-black/10 bg-white/72">
                              <button type="button" onClick={() => form.setValue('guests', Math.max(1, guests - 1), { shouldDirty: true })} className="flex h-14 items-center justify-center text-on-light-muted">
                                <Minus className="h-4 w-4" />
                              </button>
                              <div className="flex h-14 items-center justify-center border-x border-black/10 font-body text-lg">{guests}</div>
                              <button type="button" onClick={() => form.setValue('guests', Math.min(12, guests + 1), { shouldDirty: true })} className="flex h-14 items-center justify-center text-on-light-muted">
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="booking-panel p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.24em]">{locale === 'hr' ? 'Odabrani prostor' : 'Selected area'}</p>
                                <p className="mt-2 font-display text-3xl text-on-light-title">{t(`reservation_page.form.areas.${selectedArea}`)}</p>
                              </div>
                              <Waves className="h-5 w-5 text-[hsl(var(--brand-gold))]" />
                            </div>
                            <p className="mt-4 font-body text-sm leading-7 text-on-light-body">{areaImageMap[selectedArea]}</p>
                          </div>
                        </div>

                        <div className="booking-panel p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.24em]">{t('reservation_page.form.date')}</p>
                              <p className="mt-2 font-display text-3xl text-on-light-title">{locale === 'hr' ? 'Odaberite termin dolaska' : 'Choose your arrival moment'}</p>
                            </div>
                            <CalendarDays className="h-5 w-5 text-[hsl(var(--brand-gold))]" />
                          </div>
                          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                            {upcomingDates.map((date) => (
                              <button
                                key={date.value}
                                type="button"
                                onClick={() => form.setValue('date', date.value, { shouldDirty: true, shouldValidate: true })}
                                className={cn(
                                  'rounded-[1.2rem] border px-4 py-4 text-left transition',
                                  selectedDate === date.value
                                    ? 'border-[hsl(var(--text-inverse))] bg-[hsl(var(--text-inverse))] text-white shadow-[var(--shadow-soft)]'
                                    : 'border-black/10 bg-white/68 text-on-light-title hover:bg-white'
                                )}
                              >
                                        <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">{date.month}</p>
                                <p className="mt-2 font-display text-3xl">{date.day}</p>
                                        <p className="text-on-light-label mt-1 font-body text-xs uppercase tracking-[0.18em]">{date.weekday}</p>
                              </button>
                            ))}
                          </div>
                          {form.formState.errors.date?.message ? <p className="mt-3 text-sm text-rose-700">{form.formState.errors.date.message}</p> : null}
                        </div>

                        <div className="booking-panel p-4 sm:p-5">
                          <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.24em]">{t('reservation_page.form.time')}</p>
                          <div className="mt-5 grid gap-4">
                            {[
                              { key: 'lunch', label: locale === 'hr' ? 'Ručak · 12:00, 16:15' : 'Lunch · 12:00, 16:15', times: timeBlocks.lunch },
                              { key: 'dinner', label: locale === 'hr' ? 'Večera · 19:00, 21:30' : 'Dinner · 19:00, 21:30', times: timeBlocks.dinner },
                            ].map((block) => (
                              <div key={block.key} className="rounded-[1.3rem] border border-black/10 bg-white/64 p-4">
                                <p className="font-body text-[11px] uppercase tracking-[0.22em] text-on-light-muted">{block.label}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {block.times.map((time) => (
                                    <button
                                      key={time}
                                      type="button"
                                      onClick={() => form.setValue('time', time, { shouldDirty: true, shouldValidate: true })}
                                      className={cn(
                                        'rounded-[0.95rem] border px-4 py-3 font-body text-sm transition',
                                        selectedTime === time
                                          ? 'border-[hsl(var(--brand-gold))] bg-[hsl(var(--brand-gold))] text-[hsl(var(--text-inverse))]'
                                        : 'border-black/10 bg-white text-on-light-title hover:border-[hsl(var(--brand-gold))]/35'
                                      )}
                                    >
                                      {time}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          {form.formState.errors.time?.message ? <p className="mt-3 text-sm text-rose-700">{form.formState.errors.time.message}</p> : null}
                        </div>

                        <div className="booking-panel p-4 sm:p-5">
                          <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.24em]">{t('reservation_page.form.area')}</p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {(['terrace', 'indoor', 'bar', 'vip'] as const).map((area) => (
                              <button
                                key={area}
                                type="button"
                                onClick={() => form.setValue('area', area, { shouldDirty: true, shouldValidate: true })}
                                className={cn(
                                  'rounded-[1.2rem] border px-4 py-4 text-left transition',
                                  selectedArea === area
                                    ? 'border-[hsl(var(--text-inverse))] bg-[hsl(var(--text-inverse))] text-white shadow-[var(--shadow-soft)]'
                                    : 'border-black/10 bg-white/66 text-on-light-title hover:bg-white'
                                )}
                              >
                                <p className="font-display text-2xl">{t(`reservation_page.form.areas.${area}`)}</p>
                                <p className="text-on-light-body mt-2 font-body text-sm leading-6">{areaImageMap[area]}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-body text-sm leading-7 text-on-light-body">
                            {locale === 'hr' ? 'Prvo odaberite termin koji odgovara vašem dolasku.' : 'Start by choosing the arrival moment that fits your visit.'}
                          </p>
                          <button type="button" onClick={continueToDetails} className="luxury-button-primary justify-center">
                            {locale === 'hr' ? 'Nastavi na podatke' : 'Continue to details'}
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        <div className="rounded-[1.4rem] border border-black/10 bg-white/60 px-4 py-4">
                          <div className="grid gap-3 sm:grid-cols-4">
                            <div>
                              <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Datum' : 'Date'}</p>
                              <p className="text-on-light-title mt-2 font-body text-sm">{selectedDateLabel}</p>
                            </div>
                            <div>
                              <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Vrijeme' : 'Time'}</p>
                              <p className="text-on-light-title mt-2 font-body text-sm">{selectedTime}</p>
                            </div>
                            <div>
                              <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Gosti' : 'Guests'}</p>
                              <p className="text-on-light-title mt-2 font-body text-sm">{guests}</p>
                            </div>
                            <div>
                              <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.22em]">{locale === 'hr' ? 'Prostor' : 'Area'}</p>
                              <p className="text-on-light-title mt-2 font-body text-sm">{t(`reservation_page.form.areas.${selectedArea}`)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <BookingField label={t('reservation_page.form.name')} error={form.formState.errors.name?.message}>
                            <BookingInput {...form.register('name')} placeholder={t('reservation_page.form.name_placeholder')} />
                          </BookingField>
                          <BookingField label={t('reservation_page.form.email')} error={form.formState.errors.email?.message}>
                            <BookingInput type="email" {...form.register('email')} placeholder="name@example.com" />
                          </BookingField>
                        </div>

                        <BookingField label={t('reservation_page.form.phone')} error={form.formState.errors.phone?.message}>
                          <BookingInput {...form.register('phone')} placeholder="+385 ..." />
                        </BookingField>

                        <div className="booking-panel p-4 sm:p-5">
                          <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.24em]">
                            {locale === 'hr' ? 'Je li ovo posebna prigoda?' : 'Is this a special occasion?'}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {occasionOptions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleTag(item, occasionTags, setOccasionTags)}
                                className={cn(
                                  'rounded-full border px-4 py-2 font-body text-sm transition',
                                  occasionTags.includes(item)
                                    ? 'border-[hsl(var(--text-inverse))] bg-[hsl(var(--text-inverse))] text-white'
                                    : 'border-black/10 bg-white text-on-light-title hover:bg-white'
                                )}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="booking-panel p-4 sm:p-5">
                          <p className="text-on-light-label font-body text-[10px] uppercase tracking-[0.24em]">
                            {locale === 'hr' ? 'Prehrambene napomene' : 'Dietary preferences'}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {dietaryOptions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleTag(item, dietaryTags, setDietaryTags)}
                                className={cn(
                                  'rounded-full border px-4 py-2 font-body text-sm transition',
                                  dietaryTags.includes(item)
                                    ? 'border-[hsl(var(--brand-gold))] bg-[hsl(var(--brand-gold))] text-[hsl(var(--text-inverse))]'
                                    : 'border-black/10 bg-white text-on-light-title hover:bg-white'
                                )}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        <BookingField label={t('reservation_page.form.notes')} hint={t('reservation_page.form.notes_hint')}>
                          <BookingTextarea rows={5} {...form.register('notes')} placeholder={t('reservation_page.form.notes_placeholder')} />
                        </BookingField>

                        <label className="booking-panel flex gap-3 px-4 py-4">
                          <input type="checkbox" {...form.register('consent')} className="mt-1 h-4 w-4 accent-[hsl(var(--brand-gold))]" />
                          <span className="font-body text-sm leading-7 text-on-light-body">{t('reservation_page.form.consent')}</span>
                        </label>

                        {submissionError ? <p className="text-sm text-rose-700">{submissionError}</p> : null}
                        {isError ? (
                          <p className="text-sm text-amber-700">
                            {locale === 'hr'
                              ? 'Backend trenutno nije dostupan. WhatsApp rezervacija i dalje radi, a evidencija će se sinkronizirati kasnije.'
                              : 'The backend is currently unavailable. WhatsApp reservation still works, and the audit copy will sync later.'}
                          </p>
                        ) : null}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <button type="button" onClick={() => setStep(1)} className="luxury-button-secondary border-black/10 bg-black/5 text-on-light-title">
                            {locale === 'hr' ? 'Natrag' : 'Back'}
                          </button>
                          <button type="submit" className="luxury-button-primary justify-center" disabled={isSubmitting}>
                            <Sparkles className="h-4 w-4" />
                            {isSubmitting
                              ? (locale === 'hr' ? 'Otvaramo WhatsApp...' : 'Opening WhatsApp...')
                              : (locale === 'hr' ? 'Pošalji na WhatsApp' : 'Send to WhatsApp')}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.form>
                </div>

                <div className="surface-night p-5 sm:p-7 lg:p-8">
                  <p className="section-kicker">{t('reservation_page.process_label')}</p>
                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                    <p className="font-display text-[2.2rem] leading-[0.94] text-on-dark-title headline-focus">{settings.businessName}</p>
                    <p className="mt-3 font-body text-sm leading-7 text-on-dark-body">{settings.address}, {settings.city}</p>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {[t('reservation_page.process_points.one'), t('reservation_page.process_points.two'), t('reservation_page.process_points.three')].map((item, index) => (
                      <div key={item} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                        <p className="gold-glow font-body text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--brand-gold))]">0{index + 1}</p>
                        <p className="mt-3 font-body text-[0.98rem] leading-7 text-on-dark-body">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                    <p className="section-kicker">{locale === 'hr' ? 'Trenutni odabir' : 'Current selection'}</p>
                    <div className="mt-4 grid gap-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-on-dark-muted font-body text-sm">{locale === 'hr' ? 'Datum' : 'Date'}</span>
                        <span className="font-body text-sm text-white">{selectedDateLabel}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-on-dark-muted font-body text-sm">{locale === 'hr' ? 'Vrijeme' : 'Time'}</span>
                        <span className="font-body text-sm text-white">{selectedTime || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-on-dark-muted font-body text-sm">{locale === 'hr' ? 'Gosti' : 'Guests'}</span>
                        <span className="font-body text-sm text-white">{guests}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-dark-muted font-body text-sm">{locale === 'hr' ? 'Prostor' : 'Area'}</span>
                        <span className="font-body text-sm text-white">{t(`reservation_page.form.areas.${selectedArea}`)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                    <p className="section-kicker">{t('reservation_page.contact_timing_label')}</p>
                    <div className="text-on-dark-body mt-5 font-body text-sm leading-7">
                      <p>{t('visit.hours_weekday')}</p>
                      <p>{t('visit.hours_weekend')}</p>
                      <p className="pt-4">{settings.whatsappPhone}</p>
                      <p>{settings.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </BookingSurface>
          )}
        </div>
      </section>
      <EditorialSection tone="ivory" className="pt-0">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <div className="panel-ivory-elevated rounded-[1.8rem] p-6 sm:p-7">
              <p className="section-kicker">{locale === 'hr' ? 'Dolazak' : 'Arrival'}</p>
              <h2 className="headline-sea mt-4 font-display text-4xl text-on-light-title">
                {locale === 'hr' ? 'Dolazite iz Vodica ili Srime? Rezervacija i dolazak trebaju biti jednostavni.' : 'Coming from Vodice or Srima? Booking and arrival should stay simple.'}
              </h2>
              <p className="copy-marine mt-4 body-md">
                {locale === 'hr'
                  ? 'Zato je rezervacijski tok kratak, jasan i vezan uz stvarnu raspoloživost. Ako ciljate sunset termin, stol uz rivu ili večer s događanjem, najbolje je poslati upit malo ranije.'
                  : 'That is why the booking flow stays short, clear, and tied to real availability. If you are aiming for sunset, a front-row waterfront table, or an event night, it is best to send the request a bit earlier.'}
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="panel-night-elevated rounded-[1.8rem] p-6 text-white sm:p-7">
              <p className="section-kicker">{locale === 'hr' ? 'Praktično' : 'Practical'}</p>
              <ul className="mt-4 space-y-3 font-body text-sm leading-7 text-white/88">
                <li>{locale === 'hr' ? 'Za sunset stolove i veće grupe rezervacija je jači izbor od dolaska bez najave.' : 'For sunset tables and larger groups, booking ahead is stronger than arriving without notice.'}</li>
                <li>{locale === 'hr' ? 'Ako ste smješteni u Vodicama ili Srimi, otvorite lokaciju unaprijed i dođite nekoliko minuta ranije zbog večernje gužve.' : 'If you are staying in Vodice or Srima, open the location in advance and arrive a few minutes earlier because of the evening flow.'}</li>
                <li>{locale === 'hr' ? 'Najtraženiji termini nisu isti svaki dan, zato je potvrda iz stvarnog operativnog toka važna.' : 'The most requested time slots are not identical every day, which is why confirmation from the real operational flow matters.'}</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <LuxuryButtonPrimary href={GOOGLE_MAPS_URL}>{locale === 'hr' ? 'Otvori Google Maps' : 'Open Google Maps'}</LuxuryButtonPrimary>
                <LuxuryButtonSecondary href={`tel:${settings.phone.replace(/\s+/g, '')}`}>{settings.phone}</LuxuryButtonSecondary>
              </div>
            </div>
          </Reveal>
        </div>
      </EditorialSection>
    </Layout>
  );
};

export default Reservation;
