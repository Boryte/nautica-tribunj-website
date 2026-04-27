import { motion } from 'framer-motion';
import { resolveLocale, type GalleryCollectionDTO } from '@shared/index';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GlimpseRail, type GlimpseRailGroup } from '@/components/GlimpseRail';
import { Layout } from '@/components/Layout';
import { PremiumImage } from '@/components/PremiumImage';
import { Reveal, RevealGroup } from '@/components/Reveal';
import { SocialShowcase } from '@/components/SocialShowcase';
import { VenueMapWidget } from '@/components/VenueMapWidget';
import {
  DarkShowcaseSection,
  EditorialSection,
  FloatingCTA,
  HeroFrame,
  LuxuryButtonPrimary,
  LuxuryButtonSecondary,
  SectionIntro,
  ShowcaseMedia,
  TribunjMediaStory,
} from '@/components/public/PublicPrimitives';
import { LocalizedHead } from '@/components/seo/LocalizedHead';
import { BackendOfflineNotice } from '@/components/states/BackendOfflineNotice';
import { PageState } from '@/components/states/PageState';
import { usePublicBootstrap } from '@/hooks/use-site-data';
import { buildBreadcrumbSchema, buildLocalBusinessSchema, buildOrganizationSchema, buildWebPageSchema, buildWebsiteSchema, GOOGLE_MAPS_URL, toLocalizedUrl } from '@/lib/seo';
import { buildLocalAreaCards } from '@/lib/local-seo';
import { siteMedia } from '@/lib/site-media';
import { LocalizedLink } from '@/components/LocalizedLink';

const dedupeMediaCollections = (collections: GalleryCollectionDTO[]) => {
  const seen = new Set<number>();
  return collections.flatMap((collection) =>
    collection.items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
  );
};

const buildHomepageGlimpses = (collections: GalleryCollectionDTO[], locale: 'hr' | 'en'): GlimpseRailGroup[] =>
  collections
    .filter((collection) => collection.items.length > 0)
    .map((collection) => ({
      id: `collection-${collection.id}`,
      label: locale === 'hr' ? 'Media' : 'Media',
      title: collection.name,
      coverImageUrl: collection.items[0].url,
      coverAlt: collection.items[0].localizations[locale].alt || collection.name,
      itemCount: collection.items.length,
      ctaUrl: '/media',
      ctaLabel: locale === 'hr' ? 'Otvori media' : 'Open media',
      slides: collection.items.slice(0, 4).map((item) => ({
        id: `collection-${collection.id}-item-${item.id}`,
        mediaType: item.mediaType,
        mediaUrl: item.url,
        alt: item.localizations[locale].alt || collection.name,
        caption: item.localizations[locale].caption || item.localizations[locale].alt,
        durationMs: item.mediaType === 'video' ? 5600 : 4600,
        focalPointX: item.focalPointX,
        focalPointY: item.focalPointY,
      })),
    }));

const Index = () => {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const { data: bootstrap, isLoading, isError, backendOffline } = usePublicBootstrap(locale);

  if (isLoading) {
    return <Layout><PageState title={t('common.loading')} description={t('hero.description')} /></Layout>;
  }

  if (isError && !backendOffline) {
    return <Layout><PageState title={t('common.error')} description={t('hero.description')} /></Layout>;
  }

  const heroPrimary = 'Nautica';
  const heroSecondary = t('hero.headline');
  const heroDescription = t('hero.description');
  const pageTitle = locale === 'hr' ? 'Nautica Tribunj | Cocktail bar & caffe bar uz more' : 'Nautica Tribunj | Seafront cocktail bar and coffee bar';
  const pageDescription = locale === 'hr'
    ? 'Cocktail bar i caffe bar na rivi u Tribunju, blizu Vodica i Srime, za jutarnju kavu, sunset koktele, događanja i rezervacije uz more.'
    : 'A seafront cocktail bar and coffee bar in Tribunj, close to Vodice and Srima, for morning coffee, sunset cocktails, events, and reservations by the sea.';
  const pageUrl = toLocalizedUrl('/', locale);
  const heroKicker = t('hero.subtitle');
  const featuredEvents = bootstrap.featuredEvents.slice(0, 3);
  const menuCategories = Array.from(new Set(bootstrap.menu.map((item) => item.category))).slice(0, 4);
  const glimpseGroups = buildHomepageGlimpses(bootstrap.mediaCollections, locale);
  const socialFallbackItems = dedupeMediaCollections(bootstrap.mediaCollections);
  const localAreaCards = buildLocalAreaCards(locale);

  return (
    <Layout>
      <LocalizedHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/"
        locale={locale}
        image={siteMedia.hero.src}
        imageAlt={locale === 'hr' ? 'Nautica cocktail bar i caffe bar u Tribunju pri zalasku sunca' : 'Nautica cocktail bar and coffee bar in Tribunj at sunset'}
        schemas={[
          buildWebsiteSchema(locale),
          buildOrganizationSchema(bootstrap.settings),
          buildLocalBusinessSchema(locale, bootstrap.settings),
          buildWebPageSchema({ locale, title: pageTitle, description: pageDescription, url: pageUrl }),
          buildBreadcrumbSchema([{ name: heroPrimary, url: pageUrl }]),
        ]}
      />

      <HeroFrame
        eyebrow={heroKicker}
        title={
          <>
            <span className="block">{heroPrimary}</span>
            <span className="mt-1 block max-w-[9.5ch] text-[0.84em] leading-[0.94] text-white/88 sm:mt-2">
              {heroSecondary}
            </span>
          </>
        }
        description={heroDescription}
        media={
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1, y: [0, -10, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-full"
          >
            <PremiumImage src={siteMedia.hero.src} webpSrc={siteMedia.hero.webpSrc} width={siteMedia.hero.width} height={siteMedia.hero.height} alt={locale === 'hr' ? 'Terasa Nautice u Tribunju pri zalasku sunca' : 'Nautica terrace in Tribunj at sunset'} className="h-full w-full" priority drift sizes="100vw" />
          </motion.div>
        }
        actions={
          <>
            <LuxuryButtonPrimary to="/reservation">{t('hero.cta_reserve')}</LuxuryButtonPrimary>
            <LuxuryButtonSecondary to="/menu">{t('hero.cta_menu')}</LuxuryButtonSecondary>
          </>
        }
        aside={
          featuredEvents[0] ? (
            <div className="hero-feature-card">
              <div className="hero-feature-card-soft">
                <p className="section-kicker">{t('home_page.tonight_label')}</p>
                <LocalizedLink to={`/events/${featuredEvents[0].slug}`} className="mt-4 block">
                  <p className="font-display text-[2.25rem] leading-[0.94] text-[hsl(var(--text-on-image))] sm:text-[2.65rem]">
                    {featuredEvents[0].localizations[locale].title}
                  </p>
                  <p className="mt-4 max-w-[26ch] font-body text-[0.95rem] leading-7 text-white/90">
                    {featuredEvents[0].localizations[locale].teaser}
                  </p>
                </LocalizedLink>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <div className="inline-flex items-center gap-2 text-[hsl(var(--brand-gold))]">
                    <CalendarDays className="h-4 w-4" />
                    <span className="font-body text-[10px] uppercase tracking-[0.24em]">
                      {new Date(featuredEvents[0].startsAt).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <LocalizedLink to={`/events/${featuredEvents[0].slug}`} className="luxury-button-ghost whitespace-nowrap">
                    {t('hero.cta_events')}
                    <ArrowRight className="h-4 w-4" />
                  </LocalizedLink>
                </div>
              </div>
            </div>
          ) : null
        }
      />

      {glimpseGroups.length > 0 ? <GlimpseRail groups={glimpseGroups} locale={locale} /> : null}

      <div className="homepage-flow">
        <EditorialSection tone="ivory" className="pt-0">
          <SectionIntro
            eyebrow={locale === 'hr' ? 'Lokalni vodič' : 'Local guide'}
            title={locale === 'hr' ? 'Jedan od prvih kafica u Tribunju, ali Nautica prirodno ulazi i u plan gostima iz Vodica i Srime.' : 'One of the first coffee shops in Tribunj, but Nautica naturally belongs on the list for guests staying in Vodice and Srima too.'}
            description={
              locale === 'hr'
                ? 'Ovaj dio postoji i za ljude i za tražilice: jasno objašnjava gdje smo, kome odgovaramo i zašto je Nautica dobar izbor kad tražiš cocktail bar u Tribunju ili večer uz more blizu Vodica i Srime.'
                : 'This block exists for both people and search engines: it clearly explains where Nautica fits, who it suits, and why it works for anyone searching for a cocktail bar in Tribunj or a seaside evening close to Vodice and Srima.'
            }
            action={<FloatingCTA to="/reservation" label={locale === 'hr' ? 'Rezervirajte stol' : 'Reserve a table'} />}
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="grid gap-5 sm:grid-cols-3">
              {localAreaCards.map((card) => (
                <Reveal key={card.key}>
                  <article className="panel-ivory-elevated rounded-[1.7rem] p-6 sm:p-7">
                    <p className="section-kicker">{card.title}</p>
                    <p className="copy-marine mt-4 body-md">{card.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <div className="panel-night-elevated rounded-[1.8rem] p-6 text-white sm:p-7">
                <p className="section-kicker">{locale === 'hr' ? 'Google signali' : 'Google signals'}</p>
                <h3 className="headline-sea mt-4 font-display text-4xl text-on-dark-title">
                  {locale === 'hr' ? 'Dojmovi gostiju najbolje rade kad su stvarni, svježi i vezani uz isto mjesto.' : 'Guest signals work best when they are real, recent, and tied to the same place people actually visit.'}
                </h3>
                <p className="mt-4 body-md text-on-dark-body">
                  {locale === 'hr'
                    ? 'Umjesto agresivnog review spama, vodimo ljude izravno na Google Maps, rezervacije i stvarne događaje. To je čišći put i za lokalni ranking i za povjerenje.'
                    : 'Instead of aggressive review spam, we push people toward Google Maps, reservations, and real event pages. It is a cleaner path for both local ranking and trust.'}
                </p>
                <div className="mt-6">
                  <VenueMapWidget locale={locale} settings={bootstrap.settings} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <LuxuryButtonSecondary to="/events">{locale === 'hr' ? 'Pogledaj događanja' : 'View events'}</LuxuryButtonSecondary>
                </div>
              </div>
            </Reveal>
          </div>
        </EditorialSection>
        <EditorialSection className="pt-8 sm:pt-12 lg:pt-14">
          <RevealGroup as={motion.div}>
            <TribunjMediaStory
              media={(
                <Reveal>
                  <ShowcaseMedia className="min-h-[32rem]">
                    <PremiumImage src={siteMedia.about.src} webpSrc={siteMedia.about.webpSrc} width={siteMedia.about.width} height={siteMedia.about.height} alt={locale === 'hr' ? 'Atmosfera Nautice u Tribunju uz more' : 'Nautica atmosphere in Tribunj by the sea'} className="absolute inset-0 h-full w-full" drift />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,17,0.12),rgba(6,11,17,0.76))]" />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                      <p className="section-kicker">{t('home_page.atmosphere_label')}</p>
                      <h2 className="mt-3 display-md text-[hsl(var(--text-on-image))]">{t('home_page.atmosphere_title')}</h2>
                    </div>
                  </ShowcaseMedia>
                </Reveal>
              )}
            >
              <div className="max-w-2xl">
                <p className="section-kicker">{t('home_page.signature_label')}</p>
                <h2 className="headline-sea mt-3 display-lg text-[hsl(var(--text-primary))]">{t('home_page.signature_sequence_title')}</h2>
                <p className="copy-marine mt-6 body-xl">{t('brand.intro')}</p>
                <div className="mt-10 grid gap-6 sm:grid-cols-3">
                  {['one', 'two', 'three'].map((entry) => (
                    <div key={entry}>
                      <p className="font-display text-3xl text-[hsl(var(--text-primary))]">
                        {t(`home_page.atmosphere_moments.${entry}.title`)}
                      </p>
                      <p className="mt-3 body-md">{t(`home_page.atmosphere_moments.${entry}.body`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TribunjMediaStory>
          </RevealGroup>
        </EditorialSection>

        <EditorialSection tone="ivory" className="pt-0">
          <RevealGroup className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]" as={motion.div}>
            <Reveal className="flex flex-col justify-center">
              <p className="section-kicker">{t('home_page.menu_label')}</p>
              <h2 className="headline-sea mt-3 display-lg text-[hsl(var(--text-inverse))]">
                {locale === 'hr' ? 'Meni prati isti val bilo jutro, vecer ili noć.' : 'The menu follows the same tide whether it is morning, evening, or night.'}
              </h2>
              <p className="mt-6 body-xl text-[hsl(var(--text-inverse))]/90">
                {t('home_page.menu_body')}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LuxuryButtonPrimary to="/menu">{t('home_page.open_edition')}</LuxuryButtonPrimary>
                <LuxuryButtonSecondary to="/reservation" className="border-black/10 bg-black/5 text-[hsl(var(--text-inverse))]">
                  {t('hero.cta_reserve')}
                </LuxuryButtonSecondary>
              </div>
            </Reveal>

            <Reveal>
              <div className="booking-surface relative min-h-[34rem] p-4 sm:p-5 lg:min-h-[40rem] lg:p-6">
                <div className="absolute inset-x-6 top-6 h-20 rounded-full bg-[radial-gradient(circle,rgba(255,175,101,0.22),transparent_70%)] blur-3xl" />
                <div className="grid h-full gap-4 lg:grid-cols-[1.12fr_0.88fr]">
                  <div className="relative overflow-hidden rounded-[1.9rem] border border-black/10 bg-[rgba(255,255,255,0.46)] p-6 shadow-[var(--shadow-soft)] sm:p-7">
                    <p className="section-kicker">{locale === 'hr' ? 'Večernje izdanje' : 'Evening edition'}</p>
                    <h3 className="mt-4 font-display text-[3rem] leading-[0.9] text-[hsl(var(--text-inverse))] sm:text-[4rem]">
                      {locale === 'hr' ? 'Book / Meni' : 'Book / Menu'}
                    </h3>
                    <p className="mt-4 max-w-[24rem] font-body text-[0.98rem] leading-8 text-[hsl(var(--text-inverse))]/90">
                      {locale === 'hr'
                        ? 'Kokteli, kava i ostala pića sada teku kroz poglavlja koja djeluju kao elegantna večer uz more, a ne kao običan popis.'
                        : 'Cocktails, coffee, and the rest of the drinks now flow through chapters that feel like a refined evening by the sea, not a plain list.'}
                    </p>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {menuCategories.map((category, index) => (
                        <div key={category} className="rounded-[1.25rem] border border-black/10 bg-white/70 px-4 py-4">
                          <p className="font-body text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--text-muted))]">{`0${index + 1}`}</p>
                          <p className="mt-3 font-display text-[2rem] leading-[0.94] text-[hsl(var(--text-inverse))]">
                            {t(`menu_page.categories.${category}`)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="relative overflow-hidden rounded-[1.7rem] border border-black/10 bg-[rgba(16,20,27,0.94)] p-5 text-white shadow-[var(--shadow-premium)]">
                      <p className="section-kicker">{locale === 'hr' ? 'Signature flow' : 'Signature flow'}</p>
                      <p className="mt-4 font-display text-[2.5rem] leading-[0.92] text-[hsl(var(--text-on-image))]">
                        {locale === 'hr' ? 'Više osjećaja, manje šuma.' : 'More feeling, less noise.'}
                      </p>
                      <p className="mt-4 font-body text-sm leading-7 text-white/92">
                        {locale === 'hr'
                          ? 'Uzivite se u predivno iskustvo kao da ste na rivi u Tribnju.'
                          : 'Enjoy yourself in a wonderful experience as if you were on the seafront in Tribunj.'}
                      </p>
                    </div>

                    <ShowcaseMedia className="min-h-[16rem] rounded-[1.7rem]">
                      <PremiumImage
                        src={siteMedia.cocktails.src}
                        webpSrc={siteMedia.cocktails.webpSrc}
                        width={siteMedia.cocktails.width}
                        height={siteMedia.cocktails.height}
                        alt={locale === 'hr' ? 'Nautica signature kokteli' : 'Nautica signature cocktails'}
                        className="absolute inset-0 h-full w-full"
                        imageClassName="h-full w-full"
                        sizes="(min-width: 1024px) 32vw, 100vw"
                        drift
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,17,0.12),rgba(6,11,17,0.82))]" />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="font-display text-[2.1rem] leading-[0.94] text-[hsl(var(--text-on-image))]">{t('home_page.menu_title')}</p>
                      </div>
                    </ShowcaseMedia>
                  </div>
                </div>
              </div>
            </Reveal>
          </RevealGroup>
        </EditorialSection>

        <DarkShowcaseSection>
          <SectionIntro
            eyebrow={t('events_page.title')}
            title={locale === 'hr' ? 'Noći dobivaju težinu kad su program, svjetlo i more u istoj rečenici.' : 'Nights carry more weight when programming, light, and the sea belong to the same sentence.'}
            description={locale === 'hr' ? 'Istaknuta događanja vode ritam mjesta, od sunset sessiona do večeri koje ostaju vezane uz pogled, glazbu i more.' : 'Featured events shape the venue’s tempo, from sunset sessions to nights tied to the view, music, and the sea.'}
            tone="dark"
            action={<FloatingCTA to="/events" label={t('hero.cta_events')} />}
          />
          {featuredEvents.length > 0 ? (
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {featuredEvents.map((event, index) => (
                <Reveal key={event.id} className={index === 0 ? 'lg:col-span-2' : ''}>
                  <LocalizedLink to={`/events/${event.slug}`}>
                    <article className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/20 shadow-[var(--shadow-premium)]">
                      <div className={index === 0 ? 'aspect-[16/10]' : 'aspect-[4/5]'}>
                        <PremiumImage
                          src={event.gallery[0]?.url ?? event.imageUrl ?? siteMedia.hero.src}
                          alt={event.localizations[locale].title}
                          className="h-full w-full"
                          imageClassName="transition duration-700 group-hover:scale-[1.04]"
                          sizes={index === 0 ? '(min-width: 1024px) 56vw, 100vw' : '(min-width: 1024px) 28vw, 100vw'}
                          drift
                          focalPointX={event.gallery[0]?.focalPointX ?? null}
                          focalPointY={event.gallery[0]?.focalPointY ?? null}
                        />
                      </div>
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,17,0.08),rgba(6,11,17,0.9))]" />
                      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                        <span className="showcase-chip">{index === 0 ? t('home_page.featured_badge') : event.category}</span>
                        <h3 className="mt-4 font-display text-4xl leading-[0.94] text-[hsl(var(--text-on-image))]">
                          {event.localizations[locale].title}
                        </h3>
                        <p className="mt-4 font-body text-[0.95rem] leading-7 text-white/92">{event.localizations[locale].teaser}</p>
                        <div className="mt-6 inline-flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--brand-gold))]">
                          <CalendarDays className="h-4 w-4" />
                          {event.category}
                        </div>
                      </div>
                    </article>
                  </LocalizedLink>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <BackendOfflineNotice
                compact
                title={locale === 'hr' ? 'Događanja trenutno nisu učitana.' : 'Events are not currently loaded.'}
                body={locale === 'hr' ? 'Čim backend ponovno bude dostupan, ovdje će se vratiti live raspored i istaknute večeri.' : 'As soon as the backend is available again, the live schedule and featured nights will appear here again.'}
              />
            </div>
          )}
        </DarkShowcaseSection>

        <EditorialSection tone="ivory">
          <SocialShowcase locale={locale} fallbackItems={socialFallbackItems} />
        </EditorialSection>

        <EditorialSection tone="booking">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <p className="section-kicker">{t('visit.title')}</p>
              <h2 className="headline-sea mt-3 display-lg text-[hsl(var(--text-inverse))]">{t('home_page.reservation_title')}</h2>
              <p className="mt-6 body-xl text-[hsl(var(--text-inverse))]/90">{t('home_page.reservation_body')}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LuxuryButtonPrimary to="/reservation">{t('hero.cta_reserve')}</LuxuryButtonPrimary>
                <LuxuryButtonSecondary href={`tel:${bootstrap.settings.phone.replace(/\s+/g, '')}`} className="border-black/10 bg-black/5 text-[hsl(var(--text-inverse))]">
                  {bootstrap.settings.phone}
                </LuxuryButtonSecondary>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="booking-panel p-5">
                <p className="section-kicker">{t('home_page.opening_hours_label')}</p>
                <p className="mt-4 font-display text-3xl">{t('visit.hours_weekday')}</p>
                <p className="mt-2 body-md text-[hsl(var(--text-inverse))]/86">{t('visit.hours_weekend')}</p>
              </div>
              <div className="booking-panel flex flex-col justify-between p-5">
                <div>
                  <p className="section-kicker">{t('home_page.contact_label')}</p>
                  <div className="mt-4 flex items-start gap-3 text-[hsl(var(--text-inverse))]/90">
                    <MapPin className="mt-1 h-4 w-4 text-[hsl(var(--brand-gold))]" />
                    <div className="font-body text-sm leading-7">
                      <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="block transition hover:text-[hsl(var(--text-inverse))]">
                        <p>{bootstrap.settings.address}</p>
                        <p>{bootstrap.settings.city}</p>
                      </a>
                      <a href={`tel:${bootstrap.settings.phone.replace(/\s+/g, '')}`} className="block pt-2 transition hover:text-[hsl(var(--text-inverse))]">{bootstrap.settings.phone}</a>
                      <a href={`mailto:${bootstrap.settings.email}`} className="block transition hover:text-[hsl(var(--text-inverse))]">{bootstrap.settings.email}</a>
                    </div>
                  </div>
                </div>
                <a href={`mailto:${bootstrap.settings.email}`} className="luxury-button-ghost mt-6">
                  {bootstrap.settings.email}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </EditorialSection>
      </div>
    </Layout>
  );
};

export default Index;
