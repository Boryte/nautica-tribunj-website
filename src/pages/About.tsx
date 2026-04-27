import { resolveLocale } from '@shared/index';
import { HeartHandshake, Martini, Waves } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { PremiumImage } from '@/components/PremiumImage';
import { Reveal } from '@/components/Reveal';
import { EditorialSection, HeroFrame, LuxuryButtonPrimary, LuxuryButtonSecondary, SectionIntro } from '@/components/public/PublicPrimitives';
import { LocalizedHead } from '@/components/seo/LocalizedHead';
import { BackendOfflineNotice } from '@/components/states/BackendOfflineNotice';
import { PageState } from '@/components/states/PageState';
import { usePublicBootstrap } from '@/hooks/use-site-data';
import { buildBreadcrumbSchema, buildLocalBusinessSchema, buildWebPageSchema, GOOGLE_MAPS_URL, toLocalizedUrl } from '@/lib/seo';
import { siteMedia } from '@/lib/site-media';
import { buildLocalAreaCards } from '@/lib/local-seo';
import { fallbackSiteSettings } from '@/lib/site-settings';

const About = () => {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);
  const { data: bootstrap, isLoading, isError, backendOffline } = usePublicBootstrap(locale);

  if (isLoading) return <Layout><PageState title={t('common.loading')} description={t('about.hero_subtitle')} /></Layout>;
  if (isError && !backendOffline) return <Layout><PageState title={t('common.error')} description={t('about.hero_subtitle')} /></Layout>;
  const settings = bootstrap?.settings ?? fallbackSiteSettings;

  const pageTitle = locale === 'hr' ? `O Nautici | Cocktail bar i caffe bar u Tribunju` : `About Nautica | Seafront cocktail bar in Tribunj`;
  const pageDescription = locale === 'hr'
    ? 'Priča o Nautici, cocktail baru i caffe baru na rivi u Tribunju kojem se vraćaju i gosti iz Vodica, Srime i ostatka obale.'
    : 'The story of Nautica, a seafront cocktail bar and coffee bar in Tribunj that also draws guests from Vodice, Srima, and the surrounding coast.';
  const pageUrl = toLocalizedUrl('/about', locale);

  const localAreaCards = buildLocalAreaCards(locale);

  const values = [
    { icon: Waves, title: t('about_page.values.horizon_title'), body: t('about.story_p1') },
    { icon: Martini, title: t('about_page.values.taste_title'), body: t('about.philosophy_text') },
    { icon: HeartHandshake, title: t('about_page.values.hospitality_title'), body: t('about_page.values.hospitality_body') },
  ];

  return (
    <Layout>
      <LocalizedHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath="/about"
        locale={locale}
        image={siteMedia.about.src}
        imageAlt={locale === 'hr' ? 'Priča Nautice uz more u Tribunju' : 'The story of Nautica by the sea in Tribunj'}
        preloadImage={siteMedia.about.webpSrc}
        preloadImageType="image/webp"
        schemas={[
          buildWebPageSchema({ locale, title: pageTitle, description: pageDescription, url: pageUrl }),
          buildLocalBusinessSchema(locale, settings),
          buildBreadcrumbSchema([
            { name: 'Nautica', url: toLocalizedUrl('/', locale) },
            { name: t('about.hero_title'), url: pageUrl },
          ]),
        ]}
      />

      <HeroFrame
        compact
        eyebrow={t('about.hero_subtitle')}
        title={t('about.hero_title')}
        description={t('about.story_p1')}
        media={<PremiumImage src={siteMedia.about.src} webpSrc={siteMedia.about.webpSrc} width={siteMedia.about.width} height={siteMedia.about.height} alt={locale === 'hr' ? 'Terasa i atmosfera Nautice u Tribunju' : 'Nautica terrace and atmosphere in Tribunj'} className="hero-media" priority sizes="100vw" />}
      />

      {backendOffline ? (
        <section className="page-gutter relative z-20 -mt-6 pb-6">
          <div className="page-width">
            <BackendOfflineNotice compact />
          </div>
        </section>
      ) : null}

      <EditorialSection tone="ivory">
        <SectionIntro
          eyebrow={t('about.story_title')}
          title={t('about_page.story_intro_title')}
          description={<span className="copy-marine">{t('about.story_p1')}</span>}
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title}>
                <article className="panel-ivory-elevated rounded-[1.7rem] p-6 sm:p-7">
                  <Icon className="gold-glow h-5 w-5 text-[hsl(var(--brand-gold))]" />
                  <h3 className="headline-sea mt-4 font-display text-4xl text-on-light-title headline-focus wave-emphasis">{item.title}</h3>
                  <p className="mt-4 body-md text-on-light-body">{item.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </EditorialSection>
      <EditorialSection tone="ivory" className="pt-0">
        <div className="grid gap-5 lg:grid-cols-[0.94fr_1.06fr]">
          <Reveal>
            <div className="panel-night-elevated rounded-[1.8rem] p-6 text-white sm:p-7">
              <p className="section-kicker">{locale === 'hr' ? 'Obala oko nas' : 'The coast around us'}</p>
              <h2 className="headline-sea mt-4 font-display text-4xl text-on-dark-title">
                {locale === 'hr' ? 'Nautica je iz Tribunja, ali ritmom prirodno pripada i gostima iz Vodica i Srime.' : 'Nautica belongs to Tribunj, but its pace naturally fits guests coming from Vodice and Srima as well.'}
              </h2>
              <p className="mt-4 body-md text-on-dark-body">
                {locale === 'hr'
                  ? 'To je važno i za doživljaj i za lokalni SEO: mjesto jasno govori gdje je, kakav osjećaj nudi i kome je stvarno namijenjeno.'
                  : 'That matters both for the guest experience and for local SEO: the venue clearly explains where it is, what kind of feeling it offers, and who it genuinely suits.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LuxuryButtonPrimary href={GOOGLE_MAPS_URL}>{locale === 'hr' ? 'Otvorite lokaciju' : 'Open the location'}</LuxuryButtonPrimary>
                <LuxuryButtonSecondary to="/reservation">{locale === 'hr' ? 'Rezervirajte' : 'Reserve'}</LuxuryButtonSecondary>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-3">
            {localAreaCards.map((card) => (
              <Reveal key={card.key}>
                <article className="panel-ivory-elevated rounded-[1.6rem] p-6">
                  <p className="section-kicker">{card.title}</p>
                  <p className="copy-marine mt-4 body-md">{card.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </EditorialSection>
    </Layout>
  );
};

export default About;
